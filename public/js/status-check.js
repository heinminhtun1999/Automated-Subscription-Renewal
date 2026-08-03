const orderIdInput = document.getElementById('order-id');
const resultPlaceHolderElement = document.getElementById('result-placeholder');
const errorMessageElement = document.getElementById('error-message');
const statusResultElement = document.getElementById('status-result');
const statusCardElement = document.getElementById('status-card');
const statusIconElement = document.getElementById('status-icon');
const statusTitleElement = document.getElementById('status-title');

const customerElement = document.getElementById('result-customer');
const orderIdElement = document.getElementById('result-order-id');
const transactionIdElement = document.getElementById('result-transaction-id');
const amountValueElement = document.getElementById('result-amount');
const paymentStatusElement = document.getElementById('result-payment-status');
const processStatusElement = document.getElementById('result-process-status');
const failureReasonElement = document.getElementById('result-failure-reason');
const transactionDateElement = document.getElementById('result-transaction-date');

const machinesTableContainer = document.getElementById('machines-table-container');
const machinesTbody = document.getElementById('machines-tbody');

const processStatusConfig = {
    pending: {
        className: 'pending',
        accentColor: '#f0ad4e',
        icon: '...',
        title: 'Order Pending'
    },
    processing: {
        className: 'processing',
        accentColor: '#17a2b8',
        icon: '⏳',
        title: 'Order Processing'
    },
    completed: {
        className: 'success',
        accentColor: '#28a745',
        icon: '✔',
        title: 'Order Completed'
    },
    failed: {
        className: 'failed',
        accentColor: '#dc3545',
        icon: 'X',
        title: 'Order Failed'
    },
    error: {
        className: 'error',
        accentColor: '#dc3545',
        icon: '!',
        title: 'Processing Error'
    }
};

const paymentStatusConfig = {
    pending: 'Payment Pending',
    paid: 'Payment Successful',
    failed: 'Payment Failed'
};

function populateMachinesTable(machines) {
    if (!machines || machines.length === 0) {
        machinesTableContainer.classList.add('hidden');
        return;
    }

    machinesTbody.innerHTML = '';
    machines.forEach(machine => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${machine.machine_id}</td>
            <td>${machine.machine_type_name}</td>
            <td>RM ${parseFloat(machine.subscription_fees).toFixed(2)}</td>
            <td>${new Date(machine.end_date).toLocaleDateString('en-GB')}</td>
        `;
        machinesTbody.appendChild(row);
    });
    machinesTableContainer.classList.remove('hidden');
}

async function getPaymentStatus() {
    const orderId = orderIdInput.value.trim();

    if (!orderId) {
        errorMessageElement.textContent = 'Please enter a valid Order ID.';
        errorMessageElement.style.display = 'block';
        resultPlaceHolderElement.style.display = 'none';
        return;
    }
    errorMessageElement.textContent = '';
    errorMessageElement.style.display = 'none';

    try {
        const response = await fetch('/get-order-info?orderId=' + orderId);

        const data = await parseResponseData(response);

        const order = data.order;
        const machines = data.machines;
        const paymentStatusColor = order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'failed' ? 'text-red-600' : 'text-orange-600';
        const processStatusColor = order.process_status === 'completed' ? 'text-green-600' : order.process_status === 'failed' ? 'text-red-600' : 'text-orange-600';

        paymentStatusElement.className = `result-value ${paymentStatusColor}`;
        processStatusElement.className = `result-value ${processStatusColor}`;

        customerElement.textContent = order.company_name || 'N/A';
        orderIdElement.textContent = order.order_id || 'N/A';
        transactionIdElement.textContent = order.transaction_id || 'N/A';
        amountValueElement.textContent = order.amount ? `RM ${order.amount.toFixed(2)}` : 'N/A';
        const statusConfig = processStatusConfig[order.process_status] || processStatusConfig.error;
        
        paymentStatusElement.textContent = paymentStatusConfig[order.payment_status] || 'Unknown';
        processStatusElement.textContent = statusConfig.title || 'Unknown';
        transactionDateElement.textContent = order.paid_on ? new Date(order.paid_on).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }) : 'N/A';
        
        if (order.failed_remark) {
            failureReasonElement.textContent = order.failed_remark;
            failureReasonElement.parentElement.style.display = 'flex';
        } else {
            failureReasonElement.textContent = '';
            failureReasonElement.parentElement.style.display = 'none';
        }

        populateMachinesTable(machines);

        statusCardElement.className = `status-card ${statusConfig.className}`;
        statusCardElement.style.borderLeftColor = statusConfig.accentColor;
        statusIconElement.textContent = statusConfig.icon;
        statusIconElement.style.background = statusConfig.accentColor;
        statusTitleElement.textContent = statusConfig.title;
        
        statusResultElement.style.display = 'block';
        resultPlaceHolderElement.style.display = 'none';

    } catch (error) {
        console.error('Error fetching order info:', error);
        errorMessageElement.textContent = error.message;
        errorMessageElement.style.display = 'block';
        resultPlaceHolderElement.style.display = 'none';
        statusResultElement.style.display = 'none';
        machinesTableContainer.classList.add('hidden');
        
        const errorConfig = processStatusConfig.error;
        statusCardElement.className = `status-card ${errorConfig.className}`;
        statusCardElement.style.borderLeftColor = errorConfig.accentColor;
        statusIconElement.textContent = errorConfig.icon;
        statusIconElement.style.background = errorConfig.accentColor;
        statusTitleElement.textContent = 'Error';
        
        return;
    }
}

async function parseResponseData(response) {
    let data;

    try {
        data = await response.json();
    } catch (err) {
        console.error('Failed to parse JSON response:', err);
        data = null;
    }
    
    if (!response.ok) {
        const errorMessage = data?.message || 'An unexpected error occurred. Please try again later.';
        throw new Error(errorMessage);
    } 
    return data;
}