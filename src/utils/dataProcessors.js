const { ALPHABET, FIRST_EMAIL_DUE_DAYS, SECOND_EMAIL_DUE_DAYS, SHEET_CONFIGS } = require('./constants');

// Group rows by company name.
function groupByCompany(data) {
    const groupedData = {};

    for (const row of data) {
        const company = row.company_name;

        if (!groupedData[company]) {
            groupedData[company] = [row];
        } else {
            groupedData[company].push(row);
        }
    }
    return groupedData;
}

// Map order's payment status and process status to message to display to user
function getUserMessage(paymentStatus, processStatus) {
    if (paymentStatus === 'paid' && processStatus === 'completed') {
        return 'Payment successful. Order completed.';
    }

    if (paymentStatus === 'paid' && processStatus === 'pending') {
        return 'Payment received. We are processing your order.';
    }

    if (paymentStatus === 'paid' && processStatus === 'failed') {
        return 'Payment received, but something went wrong. Please contact support.';
    }

    if (processStatus === 'processing') {
        return 'We are verifying your payment. Please wait.';
    }

    if (paymentStatus === 'failed') {
        return 'Payment failed. Please try again.';
    }

    return 'Waiting for payment.';
}

module.exports = {
    groupByCompany,
    getUserMessage
};