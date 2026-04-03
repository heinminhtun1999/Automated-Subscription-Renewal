const statusConfig = {
    paid: {
        className: 'success',
        accentColor: '#28a745',
        icon: '✔',
        title: 'Payment Successful',
        message: message || 'Your payment has been processed successfully. Thank you.',
        amountLabel: 'Amount Paid',
        statusLabel: 'Completed'
    },
    failed: {
        className: 'failed',
        accentColor: '#dc3545',
        icon: 'X',
        title: 'Payment Failed',
        message: message || 'We could not process your payment. Please try again or contact support.',
        amountLabel: 'Amount',
        statusLabel: 'Failed'
    },
    pending: {
        className: 'pending',
        accentColor: '#f0ad4e',
        icon: '...',
        title: 'Payment Pending',
        message: message || 'Your payment is still being processed. The status will be updated shortly. Please check again in a few minutes.',
        amountLabel: 'Amount',
        statusLabel: 'Pending'
    },
    processing: {
        className: 'processing',
        accentColor: '#17a2b8',
        icon: '⏳',
        title: 'Order Processing',
        message: message || 'Payment completed. We are processing your order. Please check back shortly for the final status.',
        amountLabel: 'Amount',
        statusLabel: 'Processing'
    },
    refunded: {
        className: 'refunded',
        accentColor: '#17a2b8',
        icon: 'R',
        title: 'Payment Refunded',
        message: message || 'Your payment has been refunded. The funds will return to your original payment method in a few business days.',
        amountLabel: 'Amount',
        statusLabel: 'Refunded'
    },
    error: {
        className: 'error',
        accentColor: '#dc3545',
        icon: '!',
        title: 'Processing Error',
        message: message || 'An error occurred while processing your order. Please contact support with your order information for assistance.',
        amountLabel: 'Amount',
        statusLabel: 'Error'
    }
};


document.addEventListener('DOMContentLoaded', () => {

    const statusCardElement = document.getElementById('status-card');
    const statusTitleElement = document.getElementById('status-title');
    const statusMessageElement = document.getElementById('status-message');
    const orderIdElement = document.getElementById('order-id');
    const amountValueElement = document.getElementById('amount-value');
    const transactionIdElement = document.getElementById('transaction-id');
    const statusValueElement = document.getElementById('status-value');

    const orderdata = JSON.parse(data);

    if (!orderdata || !orderdata.orderId || !orderdata.transactionId) {
        console.warn('Order ID or Transaction ID missing in return data:', orderdata);
        return;
    }
    const { orderId, transactionId } = orderdata;

    try {
        if (orderId && transactionId) {

            let result;

            const interval = setInterval(async () => {
                let response = await fetch(`/get-order-info?orderId=${orderId}&transactionId=${transactionId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch order information.');
                }

                result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || 'Failed to retrieve order information.');
                }

                const order = result.order;

                if (!order) {
                    throw new Error('Order information is missing.', order);
                }

                if (order.process_status === 'completed') {
                    clearInterval(interval);

                    const statusCardClasses = statusCardElement.classList;
                    statusCardClasses.forEach(cls => {
                        const classes = ["success", "pending", "failed", "processing", "refunded", "error"];
                        if (classes.includes(cls)) {
                            statusCardClasses.remove(cls);
                        }
                    });

                    const selectedStatus = statusConfig[order.payment_status];

                    statusCardElement.classList.add(selectedStatus.className);
                    statusTitleElement.textContent = selectedStatus.title;
                    statusMessageElement.textContent = selectedStatus.message;
                    orderIdElement.textContent = order.order_id;
                    amountValueElement.textContent = `RM ${order.amount}`;
                    transactionIdElement.textContent = order.transaction_id;
                    statusValueElement.textContent = selectedStatus.statusLabel;
                }

            }, 5000);



            console.log(result);

        }
    } catch (error) {
        console.error('Error fetching order information:', error);
    }
});