// Email template for renewal reminder with CTA link.
const dueDateTemplate = (selectionLink) => `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#0d6efd; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600;">
                                Subscription Renewal Reminder
                            </h2>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="margin-top:0;">Dear Valued Customer,</p>

                            <p>
                                Greetings from <strong>AR VENDING</strong>.
                            </p>

                            <p>
                                Our records indicate that one or more of your subscriptions 
                                will expire within the next 45 days or 7 days.
                            </p>

                            <p>
                                To ensure uninterrupted service and continued system access, 
                                please renew your subscription at your earliest convenience.
                            </p>

                            <div style="text-align:center; margin:30px 0;">
                                <a href="${selectionLink}" 
                                   style="background-color:#0d6efd; 
                                          color:#ffffff; 
                                          padding:14px 28px; 
                                          text-decoration:none; 
                                          border-radius:6px; 
                                          font-weight:bold; 
                                          display:inline-block;
                                          font-size:15px;">
                                    Renew Now
                                </a>
                            </div>

                            <p style="margin-bottom:0;">
                                Simply click the button above and select the terminals or the machines you wish to renew.
                            </p>

                            <p style="font-size:14px; color:#666666; margin-top:25px;">
                                If you require any assistance, please contact our support team at 
                                <a href="mailto:customerservice@arvending.com.my" 
                                   style="color:#0d6efd; text-decoration:none;">
                                    customerservice@arvending.com.my
                                </a>.
                            </p>

                            <p>
                                We appreciate your continued trust in AR VENDING.
                            </p>

                            <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;">

                            <p style="font-size:13px; color:#888888; line-height:1.5; margin:0;">
                                Best regards,<br>
                                <strong style="color:#333333;">AR VENDING Team</strong><br>
                                No.31, Jalan Metro 1/1,<br>
                                Bandar Metro Puchong,<br>
                                47160 Puchong, Selangor, Malaysia<br>
                                <a href="mailto:customerservice@arvending.com.my" 
                                   style="color:#888888; text-decoration:none;">
                                    customerservice@arvending.com.my
                                </a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Email template listing failed reminder deliveries.
const failListTemplate = (failedRecipients) => `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
                    <p>Warning: The following emails failed to send for the subscription renewal:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Date/Time</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Company Name</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Email Address</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Machine Types</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Error Message</th>
                        </tr>
                        ${failedRecipients.map(recipient => {
    return `<tr>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Date/Time']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Company Name']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Email Address']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Machine Types']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Error Message']}</td>
                            </tr>`;
}).join('')}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;


// Email template for OTP delivery.
const otpTemplate = (maskedEmail, otpCode) => `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5;">

                    <tr>
                        <td style="background-color:#0d6efd; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600;">
                                Verify Your Email
                            </h2>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 40px;">
                            <p style="margin-top:0;">Hello,</p>
                            <p>
                                Use the one-time passcode below to continue your request${maskedEmail ? ` for ${maskedEmail}` : ''}. This code will expire in 5 minutes.
                            </p>

                            <div style="text-align:center; margin:24px 0;">
                                <div style="display:inline-block; padding:16px 24px; background:#f0f6ff; border-radius:8px; border:1px solid #d6e4ff;">
                                    <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:#0d6efd;">${otpCode}</span>
                                </div>
                            </div>

                            <p style="margin-bottom:0;">
                                If you did not request this code, you can ignore this email.
                            </p>

                            <hr style="border:none; border-top:1px solid #eeeeee; margin:26px 0;">

                            <p style="font-size:13px; color:#888888; line-height:1.5; margin:0;">
                                Best regards,<br>
                                <strong style="color:#333333;">AR VENDING Team</strong><br>
                                No.31, Jalan Metro 1/1,<br>
                                Bandar Metro Puchong,<br>
                                47160 Puchong, Selangor, Malaysia<br>
                                <a href="mailto:customerservice@arvending.com.my" style="color:#888888; text-decoration:none;">
                                    customerservice@arvending.com.my
                                </a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;


// HTML page that auto-submits payment form to the gateway.
const redirectTemplate = (hiddenInputs) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting to Payment</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background-color: #f4f6f8;
            font-family: Arial, sans-serif;
            color: #333333;
        }

        .card {
            width: min(520px, 92vw);
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
            text-align: center;
        }

        .card-header {
            background-color: #0d6efd;
            padding: 18px 24px;
            color: #ffffff;
            font-weight: 600;
            font-size: 18px;
        }

        .card-body {
            padding: 28px 32px 30px;
        }

        .spinner {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 4px solid #d6e4ff;
            border-top-color: #0d6efd;
            margin: 4px auto 16px;
            animation: spin 0.9s linear infinite;
        }

        h1 {
            margin: 0 0 10px;
            font-size: 20px;
        }

        p {
            margin: 0 0 18px;
            color: #666666;
            line-height: 1.5;
        }

        .progress {
            position: relative;
            height: 8px;
            border-radius: 999px;
            background: #eef3fb;
            overflow: hidden;
            margin: 0 8px;
        }

        .progress::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, #0d6efd, #6ea8fe);
            transform: translateX(-100%);
            animation: slide 1.6s ease-in-out infinite;
        }

        .note {
            margin-top: 14px;
            font-size: 13px;
            color: #888888;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes slide {
            0% {
                transform: translateX(-100%);
            }
            50% {
                transform: translateX(0%);
            }
            100% {
                transform: translateX(100%);
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-header">Subscription Renewal</div>
        <div class="card-body">
            <div class="spinner"></div>
            <h1>Redirecting to Payment</h1>
            <p>Please wait while we securely connect you to the payment gateway.</p>
            <div class="progress"></div>
            <div class="note">This should only take a moment.</div>
            <form id="paymentForm" action="${process.env.PAYMENT_URL}" method="POST">
                ${hiddenInputs.join('\n')}
            </form>
        </div>
    </div>
</body>
<script>
    document.getElementById('paymentForm').submit();
</script>
</html>`;

// Email template to notify Customer Support about successful subscription renewals.
const subscriptionRenewalSuccessTemplate = ({ companyName, amount, transactionDate, orderId, machines = [] }) => {
        const rows = machines && machines.length ? machines.map(m => `
                        <tr>
                                <td style="padding:10px;border-bottom:1px solid #e6edf3;">${m.machine_id}</td>
                                <td style="padding:10px;border-bottom:1px solid #e6edf3;">${m.machine_type_name}</td>
                                <td style="padding:10px;border-bottom:1px solid #e6edf3;">${m.subscription_fees}</td>
                                <td style="padding:10px;border-bottom:1px solid #e6edf3;">${new Date(m.end_date).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }).split(", ")[0]}</td>
                        </tr>`).join('') : `
                        <tr>
                                <td colspan="4" style="padding:16px; text-align:center; color:#64748b;">No machines listed.</td>
                        </tr>`;

        return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Subscription Renewal Successful</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin:0; padding:0; background-color:#f6f9fc; background-image: linear-gradient(180deg, #f7fbff 0%, #f6f9fc 50%, #ffffff 100%), radial-gradient(circle at 10% 10%, rgba(11,95,255,0.03) 0, rgba(11,95,255,0.03) 1px, transparent 1px); background-size: auto, 180px 180px; background-repeat: repeat, repeat; }
        .container { max-width: 680px; margin: 24px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(16,24,40,0.08); }
        .header { background:#0b5fff; color:#fff; padding:20px 24px; }
        .header h1 { margin:0; font-size:20px; }
        .content { padding:20px 24px; color:#0f1724; }
        .summary { margin:12px 0 20px; }
        .summary p { margin:6px 0; }
        table { width:100%; border-collapse:collapse; margin-top:12px; }
        th, td { text-align:left; padding:10px; border-bottom:1px solid #e6edf3; font-size:14px; }
        th { background:#f3f7fb; color:#0f1724; font-weight:600; }
        .footer { background:#f8fafc; color:#64748b; padding:14px 24px; font-size:12px; }
        .muted { color:#64748b; font-size:13px; }
        @media (max-width:600px){ .container{ margin:12px } .header h1{ font-size:18px } th,td{ padding:8px } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Subscription Renewal Successful</h1>
        </div>
        <div class="content">
            <p class="muted">This is an automated notification to inform that a subscription renewal has completed successfully.</p>

            <div class="summary">
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Amount:</strong>RM ${amount.toFixed(2)}</p>
                <p><strong>Transaction Date:</strong> ${new Date(transactionDate).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</p>
                <p><strong>Order ID:</strong> ${orderId}</p>
            </div>

            <h3>Machines Renewed</h3>

            <table role="table" aria-label="Renewed machines">
                <thead>
                    <tr>
                        <th>Machine ID</th>
                        <th>Machine Type</th>
                        <th>Amount</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <p style="margin-top:18px;">If you need more details, please check the admin dashboard.</p>
        </div>
    </div>
</body>
</html>`;
};

const failedOrdersNotificationTemplate = (orders) => {
    const rows = orders.map(order => `
        <tr>
            <td>${order.order_id}</td>
            <td>${order.transaction_id || 'N/A'}</td>
            <td>${order.processed_at}</td>
            <td>${order.amount}</td>
            <td>${order.payment_status}</td>
            <td>${order.error_message}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Failed Orders Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 100%;
                    width: 800px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #fff;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    table-layout: fixed;
                }
                th, td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Automated Subscription Renewal - Failed Orders Report</h2>
                <p>The following orders have been marked as failed. Please review them. If any of these orders have been paid, a manual refund is required.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Transaction ID</th>
                            <th>Processed Date</th>
                            <th>Amount</th>
                            <th>Payment Status</th>
                            <th>Failed Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};


const developerNotificationTemplate = (failedOrders, updateFailedOrders) => {
    const failedOrdersRows = failedOrders.map(order => `
        <tr>
            <td>${order.order_id}</td>
            <td>${order.transaction_id || 'N/A'}</td>
            <td>${new Date(order.processed_at).toLocaleString()}</td>
            <td>${order.amount}</td>
            <td>${order.payment_status}</td>
            <td>${order.error_message}</td>
        </tr>
    `).join('');

    const updateFailedOrdersRows = updateFailedOrders.map(order => `
        <tr>
            <td>${order.order_id}</td>
            <td>${order.transaction_id || 'N/A'}</td>
            <td>${new Date(order.processed_at).toLocaleString()}</td>
            <td>${order.amount}</td>
            <td>${order.payment_status}</td>
            <td>${order.error_message}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Developer Alert</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 100%;
                    width: 800px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #fff;
                }
                h2, h3 {
                    color: #333;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    table-layout: fixed;
                }
                th, td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #f2f2f2;
                }
                .section {
                    margin-bottom: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Automated Subscription Renewal - Developer Alert</h2>
                
                <div class="section">
                    <h3>Orders That Failed to Process</h3>
                    <p>The following orders failed during processing. They have been successfully marked as 'failed' in the database.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Transaction ID</th>
                                <th>Processed Date</th>
                                <th>Amount</th>
                                <th>Payment Status</th>
                                <th>Failed Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${failedOrdersRows}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h3>Critical: Orders That Failed to Update</h3>
                    <p>The following orders failed during processing AND failed to be marked as 'failed' in the database. Manual intervention is required to update their status.</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Transaction ID</th>
                                <th>Processed Date</th>
                                <th>Amount</th>
                                <th>Payment Status</th>
                                <th>Failed Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${updateFailedOrdersRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `;
};


const reconciliationSuccessTemplate = (orders) => {
    const rows = orders.map(order => `
        <tr>
            <td>${order.order_id}</td>
            <td>RM ${Number(order.amount || 0).toFixed(2)}</td>
            <td>${new Date(order.transaction_date).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Reconciliation Success</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 100%;
                    width: 800px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #fff;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    table-layout: fixed;
                }
                th, td {
                    padding: 12px;
                    border: 1px solid #ddd;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Automated Subscription Renewal - Reconciliation Success</h2>
                <p>The following orders were successfully processed during reconciliation.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Amount</th>
                            <th>Transaction Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};


module.exports = {
    dueDateTemplate,
    failListTemplate,
    otpTemplate,
    redirectTemplate,
    subscriptionRenewalSuccessTemplate,
    reconciliationSuccessTemplate,
    failedOrdersNotificationTemplate,
    developerNotificationTemplate
};