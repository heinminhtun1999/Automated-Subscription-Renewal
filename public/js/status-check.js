const orderIdInput = document.getElementById('order-id');
const statusResultElement = document.querySelector('.status-result');
const resultOrderIdElement = document.getElementById('result-order-id');
const resultStatusElement = document.getElementById('result-status');
const resultNoteElement = document.getElementById('result-note');

async function getPaymentStatus() {
    const orderId = orderIdInput.value.trim();

    if (!orderId) {
        alert('Please enter a valid Order ID.');
        return;
    }

    try {
        const response = await fetch('/get-order-info?orderId=' + orderId);
    } catch (error) {

    }
}