document.getElementById('delete-customer-btn').addEventListener('click', function () {
    document.getElementById('delete-confirm-modal').classList.remove('hidden');
});

document.getElementById('cancel-delete-btn').addEventListener('click', function () {
    document.getElementById('delete-confirm-modal').classList.add('hidden');
});

document.querySelector('[data-type-modal-overlay]').addEventListener('click', function () {
    document.getElementById('delete-confirm-modal').classList.add('hidden');
});

document.querySelector('#confirm-delete-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerId = e.target.dataset.customerId;

    if (!customerId) return;
    try {
        const response = await fetch(`/api/admin/customers/${customerId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await window?.parseResponseData(response);

        window.location.href = `/admin/customers?message=${encodeURIComponent(result.message)}`;

    } catch (error) {
        console.error('Error deleting customer:', error);
        window?.renderError('Failed to delete customer. Please try again later.', error);
    }
});

document.querySelectorAll('[data-machine-row]').forEach((row) => {
    row.addEventListener('click', () => {
        const machineId = row.dataset.machineId;
        if (!machineId) return;
        window.location.href = `/admin/machines/${machineId}`;
    });
});

// Manual Email Sending Handler
const sendEmailBtn = document.querySelector('#send-reminder-btn');
sendEmailBtn.addEventListener('click', (async e => {
    const customerId = sendEmailBtn.dataset.customerId;

    const readyLabel = document.querySelector('#send-reminder-ready');
    const sendingLabel = document.querySelector('#send-reminder-sending');

    sendEmailBtn.disabled = true;
    readyLabel.classList.add('hidden');
    sendingLabel.classList.remove('hidden');
    try {

        const response = await fetch("/api/admin/send-email", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_id: customerId
            })
        });

        const result = await window?.parseResponseData(response);

        window?.renderSuccess(result.message);

    } catch (err) {
        window?.renderError(err.message)
    }
    readyLabel.classList.remove('hidden');
    sendingLabel.classList.add('hidden');
    sendEmailBtn.disabled = false;
}));