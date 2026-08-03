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

    if (!machineId) return;
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
