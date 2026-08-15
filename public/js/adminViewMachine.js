document.getElementById('delete-machine-btn').addEventListener('click', function () {
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
    const machineId = e.target.dataset.machineId;

    if (!machineId) {
        return;
    }
    try {
        const response = await fetch(`/api/admin/machines/${machineId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await window?.parseResponseData(response);

        window.location.href = `/admin/machines?message=${encodeURIComponent(result.message)}`;

    } catch (error) {
        console.error('Error deleting machine:', error);
        window?.renderError('Failed to delete machine. Please try again later.', error);
    }
});

const manualRenewedBtn = document.getElementById('manual-renewed-btn');
const manualRenewedModal = document.getElementById('manual-renewed-modal');
const manualRenewedOverlay = document.querySelector('[data-manual-renewed-modal-overlay]');
const closeManualRenewedModalBtn = document.getElementById('close-manual-renewed-modal-btn');
const cancelManualRenewedModalBtn = document.getElementById('cancel-manual-renewed-modal-btn');
const manualRenewedForm = document.getElementById('manual-renewed-form');
const amountInput = document.getElementById('renewed-amount');
const paidDateInput = document.getElementById('paid-date');
const paymentMethodInput = document.getElementById('payment-method');
const extendByYearInput = document.getElementById('extend-by-years');
const machineIdInput = document.getElementById('form-machine-id');
const dateErrorLabel = document.getElementById('date-error-label');
const amountErrorLabel = document.getElementById('amount-error-label');
const periodErrorLabel = document.getElementById('period-error-label');


function openManualRenewedModal() {
    if (!manualRenewedModal) {
        return;
    }
    manualRenewedModal.classList.remove('hidden');
}

function closeManualRenewedModal() {
    if (!manualRenewedModal) {
        return;
    }
    manualRenewedModal.classList.add('hidden');
    amountErrorLabel.classList.add('hidden');
    dateErrorLabel.classList.add('hidden');
}


manualRenewedBtn.addEventListener('click', () => {
    const defaultAmount = Number(manualRenewedBtn.dataset.defaultAmount || 0).toFixed(2);

    if (amountInput && !amountInput.value) {
        amountInput.value = defaultAmount;
    }

    if (paidDateInput && !paidDateInput.value) {
        const now = new Date();

        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);

        paidDateInput.value = local.toISOString().slice(0, 16);
    }

    openManualRenewedModal();
});


manualRenewedOverlay.addEventListener('click', closeManualRenewedModal);

closeManualRenewedModalBtn.addEventListener('click', closeManualRenewedModal);

cancelManualRenewedModalBtn.addEventListener('click', closeManualRenewedModal);

amountInput.addEventListener('change', (e) => {
    const value = e.target.value;
    if (!value) {
        amountErrorLabel.classList.remove('hidden');
    } else {
        amountErrorLabel.classList.add('hidden');
    }
});

paidDateInput.addEventListener('change', (e) => {
    const value = e.target.value;
    if (!value) {
        dateErrorLabel.classList.remove('hidden');
    } else {
        dateErrorLabel.classList.add('hidden');
    }
});

extendByYearInput.addEventListener('change', (e) => {
    const value = e.target.value;
    if (value && value <= 0) {
        periodErrorLabel.classList.remove('hidden');
    } else {
        periodErrorLabel.classList.add('hidden');
    }
});

manualRenewedForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const paidDate = paidDateInput.value;
    const amount = amountInput.value;
    const paymentMethod = paymentMethodInput.value;
    const extendPeriod = extendByYearInput.value;
    const machineId = machineIdInput.value;

    let hasInputError = false;

    if (!paidDate) {
        dateErrorLabel.classList.remove('hidden');
        hasInputError = true;
    }

    if (!amount) {
        amountErrorLabel.classList.remove('hidden');
        hasInputError = true;
    }

    if (extendPeriod && extendPeriod <= 0) {
        periodErrorLabel.classList.remove('hidden');
        hasInputError = true;
    }

    if (hasInputError) {
        window?.renderError('Please fix the highlighted fields before continuing.');
        return;
    }


    if (!machineId) {
        window?.renderError('Machine ID is not found.');
        return;
    }

    const body = {
        paid_date: paidDate,
        payment_method: paymentMethod,
        extend_period: extendPeriod,
        machine_id: machineId,
        amount
    };

    try {
        const response = await fetch('/api/admin/add-manual-renewal-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await window?.parseResponseData(response);
        console.log(data);
        window?.renderSuccess(data?.message ?? 'Manual renewed record is ready to be submitted.');
        closeManualRenewedModal();
    } catch (e) {
        window?.renderError(e.message);
    }
});


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeManualRenewedModal();
    }
});
