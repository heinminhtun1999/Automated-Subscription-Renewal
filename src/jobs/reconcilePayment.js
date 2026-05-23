const db = require("../db/db");
const { getPendingOrProcessingOrders, updateOrder } = require("../repositories/orderRepository");
const { getAllOrderItems } = require("../repositories/orderItemRepository");
const logger = require("../utils/services/winston");
const { generateMd5 } = require("../utils/utils");
const { PAYMENT_STATUS } = require("../utils/constants");
const { getMachinesByIds, updateMachine } = require("../repositories/machineRepository");
const { updateMultipleEmailMachinesByOrderIdAndMachineIds } = require("../repositories/emailMachinesRepository");
const { sendEmail } = require("../utils/services/nodemailer");
const { failedOrdersNotificationTemplate, developerNotificationTemplate, reconciliationSuccessTemplate } = require("../utils/htmlTemplates");

async function reconcilePayments() {
    try {
        const orders = getPendingOrProcessingOrders();
        if (orders.length === 0) return;

        const orderMap = new Map();
        const orderIds = [];

        for (const o of orders) {
            orderMap.set(o.order_id, o);
            orderIds.push(o.order_id);
        }

        const orderResults = [];

        if (orderIds.length <= 100) {
            const result = await indirectStatusInquiry(orderIds);
            if (!result) {
                logger.error("Failed to retrieve order status from reconciliation API:", result);
                return;
            }

            orderResults.push(...result);

        } else {
            const batchSize = 100;

            for (let i = 0; i < orderIds.length; i += batchSize) {
                const batch = orderIds.slice(i, i + batchSize);
                const result = await indirectStatusInquiry(batch);
                if (result) {
                    orderResults.push(...result);
                } else {
                    logger.error(`Failed to retrieve order status for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(orderIds.length / batchSize)}:`, result, "Affected order IDs:", batch);
                }
            }
        }
        const orderItems = getAllOrderItems(); // Fetch all order items once to minimize database queries during processing
        const orderItemsMap = new Map();
        for (const item of orderItems) {
            if (!orderItemsMap.has(item.order_id)) {
                orderItemsMap.set(item.order_id, []);
            }
            orderItemsMap.get(item.order_id).push(item.machine_id);
        }

        const failedToProcessOrders = [];
        const successfullyProcessedOrders = [];
        for (const orderResult of orderResults) {

            const order = orderMap.get(orderResult.OrderID);
            if (order) {
                try {

                    if (orderResult?.ErrorCode && orderResult?.ErrorCode === "Q203") {
                        updateOrder(order.order_id, {
                            transaction_id: orderResult.TranID,
                            payment_status: "failed",
                            failed_remark: `Automatically marked as failed due to transaction not found in Fiuu database.\nPossible reason: User created order and did not select channel.`,
                            channel: orderResult.Channel,
                            process_status: 'failed',
                            paid_on: orderResult.BillingDate
                        }, {
                            process_status: {
                                operator: 'IN',
                                value: ['pending', 'processing']
                            },
                            process_worker_level: {
                                operator: '<=',
                                value: 2
                            }
                        });
                        logger.info(`Order ${order.order_id} marked as failed. Error Code: ${orderResult.ErrorCode}, Error Description: ${orderResult.ErrorDesc}`);
                        return;
                    }

                    const statusFromPG = orderResult.StatCode;
                    const paymentStatus = PAYMENT_STATUS[statusFromPG];

                    if (!paymentStatus) {
                        logger.warn(`Received unknown payment status code from PG for order ${orderResult.OrderID}: ${statusFromPG}. Skipping update for this order. Full response:`, orderResult);
                        return;
                    }

                    db.transaction(() => {

                        // Checking concurrent update
                        const result = updateOrder(order.order_id, {
                            process_status: 'processing',
                            process_worker_level: 2
                        },
                            {
                                process_status: {
                                    operator: 'IN',
                                    value: ['pending', 'processing']
                                },
                                process_worker_level: {
                                    operator: '<',
                                    value: 2
                                }
                            }
                        );
                        if (result.changes === 0) {
                            logger.warn(`Skipping order ${order.order_id} due to concurrent update. Current process_status: ${order.process_status}, process_worker_level: ${order.process_worker_level}`);
                            return;
                        }

                        // ========== Handling failed payment status ==========
                        // If PG status indicates failed payment, we update the order as failed with the error code and description from PG, and mark the process as failed without proceeding to update machines. 
                        if (statusFromPG == "11") {
                            updateOrder(order.order_id, {
                                transaction_id: orderResult.TranID,
                                payment_status: paymentStatus,
                                failed_remark: `Error Code: ${orderResult.ErrorCode}, Error Description: ${orderResult.ErrorDesc}`,
                                channel: orderResult.Channel,
                                process_status: 'failed',
                                paid_on: orderResult.BillingDate
                            }, {
                                process_status: {
                                    operator: '=',
                                    value: 'processing'
                                },
                                process_worker_level: {
                                    operator: '<=',
                                    value: 2
                                }
                            });
                            logger.info(`Order ${order.order_id} marked as failed. PG Status: ${statusFromPG}, Payment Status: ${paymentStatus}, Error Code: ${orderResult.ErrorCode}, Error Description: ${orderResult.ErrorDesc}`);
                            return;
                        }

                        // ========== Handling pending payment status ========== 
                        // If PG status indicates pending payment, we check the duration since the order was created. 
                        // If it's been pending for more than 48 hours, we automatically mark it as failed to prevent indefinite pending status. 
                        // If it's within 48 hours, we reset the process_status to pending for reprocessing in the next reconciliation cycle, allowing for the possibility that the payment might still go through successfully.
                        if (statusFromPG == "22") {

                            const orderCreatedDuration = order.minutes_passed / 60;
                            if (orderCreatedDuration > 48) {
                                updateOrder(order.order_id, {
                                    payment_status: 'failed',
                                    failed_remark: 'Automatically marked as failed after 48 hours of pending status without successful payment.',
                                    process_status: 'failed'
                                }, {
                                    process_status: {
                                        operator: 'IN',
                                        value: ['pending', 'processing']
                                    },
                                    process_worker_level: {
                                        operator: '<=',
                                        value: 2
                                    },
                                    payment_status: {
                                        operator: '=',
                                        value: 'pending'
                                    }
                                });
                                logger.info(`Order ${order.order_id} automatically marked as failed due to prolonged pending status. Created duration: ${orderCreatedDuration.toFixed(2)} hours.`);
                                return;
                            }

                            updateOrder(order.order_id, {
                                transaction_id: orderResult.TranID,
                                payment_status: paymentStatus,
                                channel: orderResult.Channel,
                                process_status: 'pending',
                                process_worker_level: 0
                            }, {
                                process_status: {
                                    operator: '=',
                                    value: 'processing'
                                },
                                process_worker_level: {
                                    operator: '<=',
                                    value: 2
                                }
                            });
                            logger.info(`Order ${order.order_id} is still pending. PG Status: ${statusFromPG}, Payment Status: ${paymentStatus}. Resetting process_status to pending for reprocessing.`);
                            return;
                        }

                        // ========== Handling successful payment status ==========

                        // we proceed with updating machines and marking order as completed.
                        const orderRelatedMachineIds = orderItemsMap.get(order.order_id) || [];
                        const machines = getMachinesByIds(orderRelatedMachineIds);
                        for (const machine of machines) {
                            const newEndDate = new Date(machine.end_date);
                            newEndDate.setFullYear(newEndDate.getFullYear() + 1)
                            updateMachine(machine.id, {
                                end_date: newEndDate.toISOString(),
                                renewal_process_id: null,
                                renewal_count: machine.renewal_count + 1,
                                last_renewal_date: new Date().toISOString()
                            });
                        }

                        // Removing the renewal_process_id for the email_machines for cleanup since the renewal process is completed. 
                        // This is to prevent any potential issues with stale renewal_process_id in email_machines that might affect future renewals and email sending logic.
                        updateMultipleEmailMachinesByOrderIdAndMachineIds(order.order_id, orderRelatedMachineIds, { renewal_process_id: null });

                        // Finally, update the order as completed after successfully updating the machines. 
                        updateOrder(order.order_id,
                            {
                                transaction_id: orderResult.TranID,
                                payment_status: paymentStatus,
                                channel: orderResult.Channel,
                                process_status: 'completed',
                                paid_on: orderResult.BillingDate
                            },
                            {
                                process_status:
                                {
                                    operator: '=',
                                    value: 'processing'
                                },
                                process_worker_level:
                                {
                                    operator: '<=',
                                    value: 2
                                }
                            });

                        successfullyProcessedOrders.push({
                            order_id: order.order_id,
                            transaction_date: orderResult.BillingDate,
                            amount: order.amount
                        });
                    }).immediate();

                } catch (e) {
                    logger.error(`Error processing order ${orderResult.order_id}:`, e);
                    const prepareData = {
                        order_id: order.order_id,
                        transaction_id: order.TranID,
                        processed_at: new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }),
                        error_message: (order.failed_remark ? order.failed_remark + ', ' : '') + "Server error during reconciliation: " + (e.message || 'Unknown error'),
                        payment_status: PAYMENT_STATUS[orderResult.StatCode] || 'Unknown status code',
                        amount: order.amount
                    }
                    failedToProcessOrders.push(prepareData);
                }
            }
        }

        // =========== Sending email for successfully processed orders ==========
        if (successfullyProcessedOrders.length > 0) {
            const emailBody = reconciliationSuccessTemplate(successfullyProcessedOrders);
            await sendEmail(
                process.env.CS_EMAIL,
                '|Subscription Renewal| Reconciliation Successful Orders',
                emailBody,
                'Successful Reconciliation Orders'
            );
        }

        // =========== Handling orders that are failed to process ==========

        if (failedToProcessOrders.length > 0) {
            const failedToUpdateProcessStatus = []; // track orders that failed to update process_status to failed
            for (const failedOrder of failedToProcessOrders) {
                try {
                    updateOrder(failedOrder.order_id, {
                        process_status: 'failed',
                        failed_remark: failedOrder.error_message,
                    },
                        {
                            process_status: {
                                operator: 'IN',
                                value: ['pending', 'processing']
                            },
                            process_worker_level: {
                                operator: '<',
                                value: 2
                            }
                        });
                } catch (e) {
                    const originalMessage = failedOrder.error_message;
                    const newMessage = originalMessage + `\nFailed to update process_status to failed for this order due to database error: ${e.message || 'Unknown error'}`
                    failedOrder.error_message = newMessage;
                    failedToUpdateProcessStatus.push(failedOrder);
                    logger.error(`Additionally, failed to update process_status to failed for order ${failedOrder.order_id} after processing error:`, e);
                }
            }

            // Notify customer service about the orders that failed during reconciliation processing with the corresponding error message for each order, 
            // so that they can follow up with the customers proactively and provide necessary support. This is important to maintain good customer service and address any potential issues that customers might be facing due to the failed orders.
            const emailBody = failedOrdersNotificationTemplate(failedToProcessOrders);
            await sendEmail(process.env.CS_EMAIL, '|Subscription Renewal| Reconciliation Update Failed Orders', emailBody, 'Failed Reconciliation Orders', [process.env.DEV_EMAIL]);

            // Critical: If there are orders that failed to update process_status to failed after reconciliation processing error, we need to send an additional alert email to developer with the list of those orders and the corresponding error message for further investigation and manual handling. This is important to ensure that those orders are not left in an inconsistent state without proper attention.
            if (failedToUpdateProcessStatus.length > 0) {
                const additionalEmailBody = developerNotificationTemplate(failedToProcessOrders, failedToUpdateProcessStatus);
                await sendEmail(process.env.DEV_EMAIL, '|Subscription Renewal| Critical: Failed to Update Process Status', additionalEmailBody, 'Failed Reconciliation Orders - Update Failed');
            }
        }

    } catch (e) {
        logger.error("Critical error: This is the final catch block for the reconcilePayments function. Error details:", e);
    }
}


async function indirectStatusInquiry(orderIds) {
    try {
        const oIDs = orderIds.join("|");
        const orderBody = {
            domain: process.env.merchantID,
            type: 2,
            format: 1,
            oIDs: oIDs,
        };


        const skeyString = `${process.env.merchantID}${oIDs}${process.env.verifyKey}`;
        const skey = generateMd5(skeyString);
        orderBody.skey = skey;
        const queryString = new URLSearchParams(orderBody).toString();

        const url = `${process.env.RECONCILIATION_URL}?${queryString}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to perform indirect status inquiry. HTTP status: ${response.text}`);
        }

        const result = await response.json();

        return result;

    } catch (e) {
        logger.error("Error performing indirect status inquiry:", e);
        return null;
    }
}


module.exports = reconcilePayments;