// Email template for renewal reminder with CTA link.
const dueDateTemplate = (selectionLink) => `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#0d6efd; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                Subscription Renewal Reminder
                            </h2>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="margin-top:0; font-size: 16px;">Dear Valued Customer,</p>

                            <p style="font-size: 16px;">
                                Greetings from <strong>AR VENDING</strong>.
                            </p>

                            <p style="font-size: 16px;">
                                Our records indicate that one or more of your subscriptions 
                                will expire within the next 45 days or 7 days.
                            </p>

                            <p style="font-size: 16px;">
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
                                          font-size:16px;">
                                    Renew Now
                                </a>
                            </div>

                            <p style="margin-bottom:0; font-size: 16px;">
                                Simply click the button above and select the terminals or the machines you wish to renew.
                            </p>

                            <p style="font-size:14px; color:#666666; margin-top:25px;">
                                If you require any assistance, please contact our support team at 
                                <a href="mailto:customerservice@arvending.com.my" 
                                   style="color:#0d6efd; text-decoration:none;">
                                    customerservice@arvending.com.my
                                </a>.
                            </p>

                            <p style="font-size: 16px;">
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
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="background-color:#dc3545; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                Email Delivery Failure Report
                            </h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="font-size: 16px;">Warning: The following emails failed to send for the subscription renewal:</p>
                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                <thead>
                                    <tr>
                                        <th style="border-bottom: 2px solid #dee2e6; padding: 12px 8px; text-align: left; background-color: #f8f9fa;">Date/Time</th>
                                        <th style="border-bottom: 2px solid #dee2e6; padding: 12px 8px; text-align: left; background-color: #f8f9fa;">Company Name</th>
                                        <th style="border-bottom: 2px solid #dee2e6; padding: 12px 8px; text-align: left; background-color: #f8f9fa;">Email Address</th>
                                        <th style="border-bottom: 2px solid #dee2e6; padding: 12px 8px; text-align: left; background-color: #f8f9fa;">Machine Types</th>
                                        <th style="border-bottom: 2px solid #dee2e6; padding: 12px 8px; text-align: left; background-color: #f8f9fa;">Error Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${failedRecipients.map(recipient => `
                                    <tr>
                                        <td style="border-top: 1px solid #dee2e6; padding: 12px 8px;">${recipient['Date/Time']}</td>
                                        <td style="border-top: 1px solid #dee2e6; padding: 12px 8px;">${recipient['Company Name']}</td>
                                        <td style="border-top: 1px solid #dee2e6; padding: 12px 8px;">${recipient['Email Address']}</td>
                                        <td style="border-top: 1px solid #dee2e6; padding: 12px 8px;">${recipient['Machine Types']}</td>
                                        <td style="border-top: 1px solid #dee2e6; padding: 12px 8px;">${recipient['Error Message']}</td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </td>
                    </tr>
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
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">

                    <tr>
                        <td style="background-color:#0d6efd; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                Verify Your Email
                            </h2>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px 40px;">
                            <p style="margin-top:0; font-size: 16px;">Hello,</p>
                            <p style="font-size: 16px;">
                                Use the one-time passcode below to continue your request${maskedEmail ? ` for ${maskedEmail}` : ''}. This code will expire in 5 minutes.
                            </p>

                            <div style="text-align:center; margin:24px 0;">
                                <div style="display:inline-block; padding:16px 24px; background:#f0f6ff; border-radius:8px; border:1px solid #d6e4ff;">
                                    <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:#0d6efd;">${otpCode}</span>
                                </div>
                            </div>

                            <p style="margin-bottom:0; font-size: 16px;">
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

// Email template for customers after a successful payment and machine renewal.
const customerSubscriptionRenewalSuccessTemplate = ({ companyName, amount, transactionDate, orderId, machines = [] }) => {
    const formatMoney = (value) => Number(value || 0).toFixed(2);
    const formatDateTime = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? 'N/A'
            : date.toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
    };
    const formatDate = (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? 'N/A'
            : date.toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
    };

    const rows = machines && machines.length ? machines.map(m => `
                        <tr>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${m.machine_id ?? 'N/A'}</td>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${m.machine_type_name ?? 'N/A'}</td>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">RM ${formatMoney(m.subscription_fees)}</td>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${formatDate(m.end_date)}</td>
                        </tr>`).join('') : `
                        <tr>
                                <td colspan="4" style="padding:16px; text-align:center; color:#64748b; border-top:1px solid #dee2e6;">No renewed machines listed.</td>
                        </tr>`;

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Subscription Renewal Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="background-color:#198754; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                Subscription Renewal Confirmation
                            </h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="font-size: 16px; margin-top:0;">Dear ${companyName || 'Valued Customer'},</p>

                            <p style="font-size: 16px;">
                                Your payment has been received and your selected machines have been renewed successfully.
                            </p>

                            <div style="margin:24px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                                <p style="margin:6px 0; font-size: 16px;"><strong>Company Name:</strong> ${companyName || 'N/A'}</p>
                                <p style="margin:6px 0; font-size: 16px;"><strong>Total Amount:</strong> RM ${formatMoney(amount)}</p>
                                <p style="margin:6px 0; font-size: 16px;"><strong>Transaction Date:</strong> ${formatDateTime(transactionDate)}</p>
                                <p style="margin:6px 0; font-size: 16px;"><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
                            </div>

                            <h3 style="margin-top: 30px; font-size: 20px;">Renewed Machines</h3>

                            <table role="table" aria-label="Renewed machines" style="width:100%; border-collapse:collapse; margin-top:12px; font-size: 14px;">
                                <thead>
                                    <tr>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine ID</th>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine Type</th>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine Subscription Fee</th>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">New End Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>

                            <p style="margin-top:24px; font-size: 16px;">
                                If you need any assistance, please contact our support team at
                                <a href="mailto:customerservice@arvending.com.my" style="color:#0d6efd; text-decoration:none;">customerservice@arvending.com.my</a>.
                            </p>

                            <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;">

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
</html>`
};

// Email template to notify Customer Support about successful subscription renewals.
const subscriptionRenewalSuccessTemplate = ({ companyName, amount, transactionDate, orderId, machines = [] }) => {
    const rows = machines && machines.length ? machines.map(m => `
                        <tr>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${m.machine_id}</td>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${m.machine_type_name}</td>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${m.subscription_fees}</td>
                                <td style="padding:12px 8px;border-top:1px solid #dee2e6;">${new Date(m.end_date).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }).split(", ")[0]}</td>
                        </tr>`).join('') : `
                        <tr>
                                <td colspan="4" style="padding:16px; text-align:center; color:#64748b; border-top:1px solid #dee2e6;">No machines listed.</td>
                        </tr>`;

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Subscription Renewal Successful</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="background-color:#198754; padding:20px 40px; text-align:center;">
                            <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                Subscription Renewal Successful
                            </h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="font-size: 16px;">This is an automated notification to inform that a subscription renewal has completed successfully.</p>

                            <div style="margin:24px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                                <p style="margin:6px 0; font-size: 16px;"><strong>Company:</strong> ${companyName}</p>
                                <p style="margin:6px 0; font-size: 16px;"><strong>Amount:</strong>RM ${amount.toFixed(2)}</p>
                                <p style="margin:6px 0; font-size: 16px;"><strong>Transaction Date:</strong> ${new Date(transactionDate).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</p>
                                <p style="margin:6px 0; font-size: 16px;"><strong>Order ID:</strong> ${orderId}</p>
                            </div>

                            <h3 style="margin-top: 30px; font-size: 20px;">Machines Renewed</h3>

                            <table role="table" aria-label="Renewed machines" style="width:100%; border-collapse:collapse; margin-top:12px; font-size: 14px;">
                                <thead>
                                    <tr>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine ID</th>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine Type</th>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Amount</th>
                                        <th style="padding:12px 8px;border-bottom:2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">End Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>

                            <p style="margin-top:24px; font-size: 16px;">If you need more details, please check the admin dashboard.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const failedOrdersNotificationTemplate = (orders) => {
    const rows = orders.map(order => `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.order_id}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.transaction_id || 'N/A'}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.processed_at}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.amount}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.payment_status}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.error_message}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Failed Orders Report</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background-color:#dc3545; padding:20px 40px; text-align:center;">
                                    <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                        Failed Orders Report
                                    </h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="font-size: 16px;">The following orders have been marked as failed. Please review them. If any of these orders have been paid, a manual refund is required.</p>
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Order ID</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Transaction ID</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Processed Date</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Amount</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Payment Status</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Failed Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rows}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
};

const developerNotificationTemplate = (failedOrders, updateFailedOrders) => {
    const failedOrdersRows = failedOrders.map(order => `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.order_id}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.transaction_id || 'N/A'}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${new Date(order.processed_at).toLocaleString()}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.amount}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.payment_status}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.error_message}</td>
        </tr>
    `).join('');

    const updateFailedOrdersRows = updateFailedOrders.map(order => `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.order_id}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.transaction_id || 'N/A'}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${new Date(order.processed_at).toLocaleString()}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.amount}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.payment_status}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.error_message}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Developer Alert</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background-color:#dc3545; padding:20px 40px; text-align:center;">
                                    <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                        Developer Alert
                                    </h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <div style="margin-bottom: 30px;">
                                        <h3 style="font-size: 20px;">Orders That Failed to Process</h3>
                                        <p style="font-size: 16px;">The following orders failed during processing. They have been successfully marked as 'failed' in the database.</p>
                                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                            <thead>
                                                <tr>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Order ID</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Transaction ID</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Processed Date</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Amount</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Payment Status</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Failed Remark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${failedOrdersRows}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div>
                                        <h3 style="font-size: 20px; color: #dc3545;">Critical: Orders That Failed to Update</h3>
                                        <p style="font-size: 16px;">The following orders failed during processing AND failed to be marked as 'failed' in the database. Manual intervention is required to update their status.</p>
                                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                            <thead>
                                                <tr>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Order ID</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Transaction ID</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Processed Date</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Amount</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Payment Status</th>
                                                    <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Failed Remark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${updateFailedOrdersRows}
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
};

const renewalProcessUpsertFailureTemplate = (customer, failures = []) => {
    const rows = failures.map(failure => {
        const machineId = failure.machineId ||  'N/A';
        const errorMessage = failure.errorMessage || 'N/A';

        return `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machineId}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${errorMessage}</td>
        </tr>
    `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Renewal Process Upsert Failure</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background-color:#dc3545; padding:20px 40px; text-align:center;">
                                    <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                        Renewal Process Upsert Failure
                                    </h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="font-size: 16px; margin-top:0;">The reminder email was sent successfully, but the renewal process ID upsert failed for the following machine(s). Please review the database update issue.</p>
                                    <div style="margin: 0 0 12px; padding: 12px 16px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;">
                                        <p style="margin:0 0 6px; font-size: 14px;"><strong>Date/Time:</strong> ${new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</p>
                                        <p style="margin:0; font-size: 14px;"><strong>Customer Name:</strong> ${customer}</p>
                                    </div>
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine ID</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Error Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rows || `
                                            <tr>
                                                <td colspan="2" style="padding:16px; text-align:center; color:#64748b; border-top:1px solid #dee2e6;">No failure records available.</td>
                                            </tr>`}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
};

const reconciliationSuccessTemplate = (orders) => {
    const rows = orders.map(order => `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${order.order_id}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">RM ${Number(order.amount || 0).toFixed(2)}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${new Date(order.transaction_date).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Automated Subscription Renewal - Reconciliation Success</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background-color:#198754; padding:20px 40px; text-align:center;">
                                    <h2 style="margin:0; color:#ffffff; font-weight:600; font-size: 24px;">
                                        Reconciliation Success
                                    </h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="font-size: 16px;">The following orders were successfully processed during reconciliation.</p>
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Order ID</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Amount</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Transaction Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rows}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
};

const machineDeactivationNotificationTemplate = (renewalNotAllowedMachines, renewalAllowMachines) => {
    const rows1 = renewalNotAllowedMachines.map(machine => `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machine.machine_id}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machine.machine_type_name}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machine.company_name}</td>
        </tr>
    `).join('');

    const rows2 = renewalAllowMachines.map(machine => `
        <tr>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machine.machine_id}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machine.machine_type_name}</td>
            <td style="padding: 12px 8px; border-top: 1px solid #dee2e6;">${machine.company_name}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Machine Deactivation Notification</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; color:#333333;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background-color:#ffc107; padding:20px 40px; text-align:center;">
                                    <h2 style="margin:0; color:#333333; font-weight:600; font-size: 24px;">
                                        Machine Deactivation Notification
                                    </h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <h3 style="margin:0; color:#333333; font-weight:600; font-size: 20px;">Deactived Machines</h3>
                                    <p style="font-size: 16px;">The following machines have been automatically set to inactive due to expired subscriptions on ${new Date().toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}</p>
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine ID</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine Type</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Company Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rows1}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <h3 style="margin:0; color:#333333; font-weight:600; font-size: 20px;">Active Machines</h3>
                                    <p style="font-size: 16px;">The following machines have reached the expiration date. However, they are allowed to remain active and renew beyond the expiration date. If they are not renewed, they will remain active forever.</p>
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                                        <thead>
                                            <tr>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine ID</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Machine Type</th>
                                                <th style="padding: 12px 8px; border-bottom: 2px solid #dee2e6; background-color: #f8f9fa; text-align: left;">Company Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rows2}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
};


module.exports = {
    dueDateTemplate,
    failListTemplate,
    otpTemplate,
    redirectTemplate,
    customerSubscriptionRenewalSuccessTemplate,
    subscriptionRenewalSuccessTemplate,
    reconciliationSuccessTemplate,
    failedOrdersNotificationTemplate,
    developerNotificationTemplate,
    renewalProcessUpsertFailureTemplate,
    machineDeactivationNotificationTemplate
};