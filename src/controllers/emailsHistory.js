const { getAllEmails } = require('../repositories/emailsRepository');
const { localizedDateTime } = require('../utils/utils');
const logger = require('../utils/services/winston');

function renderEmailHistoryPage(req, res) {
    try {
        const emails = getAllEmails();
        const map = new Map();

        for (const email of emails) {
            const machineData = {
                email_machine_id: email.email_machine_id,
                first_email_id: email.first_email_id,
                second_email_id: email.second_email_id,
                second_email_sent_date: localizedDateTime(email.second_email_sent_date),
                machine_id: email.machine_id,
                order_id: email.order_id,
                payment_status: email.payment_status,
                process_status: email.process_status,
                machine_type: email.machine_type_name
            }
            const isPaid = email.payment_status === 'paid';

            if (map.has(email.id)) {
                const existing = map.get(email.id);
                existing.machines[isPaid ? 'renewed' : 'pendingRenewal'].push(machineData);
            } else {
                const data = {
                    id: email.id,
                    sent_date: localizedDateTime(email.sent_date),
                    status: email.status,
                    failed_reason: email.failed_reason,
                    recipient_email: email.recipient_email,
                    customer_id: email.customer_id,
                    nodemailer_message_id: email.nodemailer_message_id,
                    company_name: email.company_name,
                    machines: { "renewed": [], "pendingRenewal": [] }
                }
                data['machines'][isPaid ? 'renewed' : 'pendingRenewal'].push(machineData);
                map.set(email.id, data);
            }
        }
        const data = Array.from(map.values());
        return res.render('admin/emails-history/index', { data, error: null });
    } catch (e) {
        logger.error('Error rendering email history page:', e);
        return res.render('admin/emails-history/index', { data: [], error: 'Failed to fetch email history' });
    }
}

module.exports = {
    renderEmailHistoryPage
}