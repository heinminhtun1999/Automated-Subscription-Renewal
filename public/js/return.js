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
    pending: {
        className: 'pending',
        text: 'Payment Pending'
    },
    paid: {
        className: 'success',
        text: 'Payment Successful'
    },
    failed: {
        className: 'failed',
        text: 'Payment Failed'
    },
    error: {
        className: 'error',
        text: 'Payment Error'
    }
};


document.addEventListener('DOMContentLoaded', () => {

    const statusCardElement = document.getElementById('status-card');
    const statusTitleElement = document.getElementById('status-title');
    const statusMessageElement = document.getElementById('status-message');
    const paymentStatusElement = document.getElementById('payment-status');
    const orderIdElement = document.getElementById('order-id');
    const amountValueElement = document.getElementById('amount-value');
    const transactionIdElement = document.getElementById('transaction-id');
    const screenShotNoticeElement = document.querySelector('.screenshot-notice');

    const orderdata = JSON.parse(data);

    if (!orderdata || !orderdata.orderId || !orderdata.transactionId) {
        console.warn('Order ID or Transaction ID missing in return data:', orderdata);
        return;
    }

    if (orderdata.process_status === 'completed') {
        return;
    }

    const { orderId } = orderdata;

    try {
        if (orderId) {

            let result;

            const interval = setInterval(async () => {
                let response = await fetch(`/get-order-info?orderId=${orderId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch order information.');
                }

                result = await response.json();
                console.log('Fetched order information:', result);
                if (!result.success) {
                    throw new Error(result.message || 'Failed to retrieve order information.');
                }

                const order = result.order;
                const machines = result.machines;
                const message = result.message;

                if (!order) {
                    throw new Error('Order information is missing.', order);
                }

                if (order.process_status === 'completed' || order.process_status === 'failed') {
                    clearInterval(interval);

                    const statusCardClasses = statusCardElement.classList;
                    statusCardClasses.forEach(cls => {
                        const classes = ['pending', 'processing', 'completed', 'failed', 'error'];
                        if (classes.includes(cls)) {
                            statusCardClasses.remove(cls);
                        }
                    });

                    const selectedStatus = processStatusConfig[order.process_status];
                    const selectedPaymentStatus = paymentStatusConfig[order.payment_status];

                    statusCardElement.classList.add(selectedStatus.className);
                    statusCardElement.style.borderColor = selectedStatus.accentColor;
                    statusCardElement.querySelector('.icon').style.backgroundColor = selectedStatus.accentColor;
                    statusCardElement.querySelector('.icon').textContent = selectedStatus.icon;

                    statusTitleElement.textContent = selectedStatus.title;

                    paymentStatusElement.textContent = selectedPaymentStatus.text;
                    paymentStatusElement.classList.add(selectedPaymentStatus.className);

                    statusMessageElement.innerHTML = message;

                    orderIdElement.textContent = order.order_id;
                    amountValueElement.textContent = `RM ${order.amount.toFixed(2)}`;
                    transactionIdElement.textContent = order.transaction_id;

                    if (order.payment_status === 'paid') {
                        const machineTable = document.getElementById('machine-table');

                        if (!machineTable && machines && machines.length > 0) {
                            const div = document.createElement('div');
                            div.classList.add('details');
                            const h3 = document.createElement('h3');
                            h3.textContent = 'Renewed Machines:';
                            div.appendChild(h3);

                            const table = document.createElement('table');
                            table.classList.add('machine-table');
                            
                            const thead = document.createElement('thead');
                            const headerRow = document.createElement('tr');
                            ['Machine ID', 'Machine Type', 'Renewal Fees', 'Renewed Until'].forEach(headerText => {
                                const th = document.createElement('th');
                                th.textContent = headerText;
                                headerRow.appendChild(th);
                            });
                            thead.appendChild(headerRow);

                            const tbody = document.createElement('tbody');
                            machines.forEach(machine => {
                                const row = document.createElement('tr');
                                const machineIdCell = document.createElement('td');
                                machineIdCell.textContent = machine.machine_id;
                                const machineTypeCell = document.createElement('td');
                                machineTypeCell.textContent = machine.machine_type_name;
                                const renewalFeesCell = document.createElement('td');
                                renewalFeesCell.textContent = `RM ${machine.subscription_fees.toFixed(2)}`;
                                const renewedUntilCell = document.createElement('td');
                                renewedUntilCell.textContent = machine.renewed_until ? new Date(machine.renewed_until).toLocaleDateString() : 'N/A';
                                row.appendChild(machineIdCell);
                                row.appendChild(machineTypeCell);
                                row.appendChild(renewalFeesCell);
                                row.appendChild(renewedUntilCell);
                                tbody.appendChild(row);
                            });
                            table.appendChild(thead);
                            table.appendChild(tbody);
                            statusCardElement.insertBefore(div, screenShotNoticeElement);
                        }
                    }
                }

            }, 5000);

        }
    } catch (error) {
        alert('An error occurred while fetching order information. Please try again later.');
        console.error('Error fetching order information:', error);
    }
});