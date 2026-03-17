const dueDateTemplate = (selectionLink, numTerminals) => `<!DOCTYPE html>
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
                                Our records indicate that ${numTerminals} or more of your subscriptions 
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
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">CID</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Company Name</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Email Address</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Terminals</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Error Message</th>
                        </tr>
                        ${failedRecipients.map(recipient => {
    return `<tr>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Date/Time']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['CID']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Company Name']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Email Address']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Terminals']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Error Message']}</td>
                            </tr>`;
}).join('')}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;



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

module.exports = { dueDateTemplate, failListTemplate, otpTemplate };