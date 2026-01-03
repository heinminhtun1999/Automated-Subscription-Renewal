const { uid } = require("./utils");

const dueDateTemplate = (paymentLink, uid, expireDate) => `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin-top: 0;">Dear Valued Customer,</p>
                            
                            <p>Greetings from <strong>AR VENDING</strong>!</p>
                            
                            <p>We’re reaching out to let you know that your subscription for <strong>TID: ${uid}</strong> is set to expire on <span style="color: #d9534f; font-weight: bold;">${expireDate}</span>.</p>
                            
                            <p>To keep your service running smoothly without any interruptions, you can renew your subscription by clicking the button below:</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${paymentLink}" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Renew Subscription Now</a>
                            </div>
                            
                            <p style="font-size: 14px; color: #666666; font-style: italic;">
                                If you encounter any issues during payment, please contact us at 
                                <a href="mailto:customerservice@arvending.com.my" style="color: #007bff; text-decoration: none;">customerservice@arvending.com.my</a>.
                            </p>
                            
                            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
                            
                            <p style="font-size: 13px; color: #888888; line-height: 1.4; margin-bottom: 0;">
                                Best regards,<br>
                                <strong style="color: #333333;">AR VENDING TEAM</strong><br>
                                No.31, Jalan Metro 1/1,<br>
                                Bandar Metro Puchong,<br>
                                47160 Puchong, Selangor, Malaysia.<br>
                                <a href="mailto:customerservice@arvending.com.my" style="color: #888888;">customerservice@arvending.com.my</a>
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
                    <p>The following emails failed to send:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Email Address</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">UID</th>
                            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Sheet Name</th>
                        </tr>
                        ${failedRecipients.map(recipient => {
                            return `<tr>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Email Address']}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${uid(recipient)}</td>
                                <td style="border: 1px solid #dddddd; padding: 8px; text-align: left;">${recipient['Sheet Name']}</td>
                            </tr>`;
                        }).join('')}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

module.exports = { dueDateTemplate, failListTemplate };