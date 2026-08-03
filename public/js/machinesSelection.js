// Toggle machine selection
function toggleMachine(element) {
    const isDisabled = element.getAttribute('data-machine-disabled') === 'true';
    if (isDisabled) return; // Do not allow selection if machine is expired
    element.classList.toggle('selected');
    updateSummary();
}

// Clear all selected machines
function clearSelected() {
    const selected = document.querySelectorAll('.machine-item.selected');
    selected.forEach(card => card.classList.remove('selected'));
    updateSummary();
}

// Update summary information
function updateSummary() {
    const selectedCards = document.querySelectorAll('.machine-item.selected');
    const selectedCount = selectedCards.length;
    let totalFee = 0;

    selectedCards.forEach(card => {
        // Extract fee from the card
        const feeText = card.querySelector('.amount')?.textContent || '0.00';
        const fee = parseFloat(feeText.replace(/[^0-9.]/g, ''));
        totalFee += fee;
    });

    // Update display
    document.getElementById('selected-count').textContent = selectedCount;
    document.getElementById('total-fee').textContent = `RM ${totalFee.toFixed(2)}`;
    // Disable/enable proceed button
    const proceedBtn = document.getElementById('proceed-btn');
    proceedBtn.disabled = selectedCount === 0;
}

// Proceed to payment
function proceedToPayment() {
    const selectedCards = document.querySelectorAll('.machine-item.selected');
    const companyNameElement = document.getElementById('company-name');
    const customerId = companyNameElement.getAttribute('data-customer-id');

    if (selectedCards.length === 0) {
        alert('Please select at least one machine before proceeding to payment.');
        return;
    }

    // Collect selected machine data
    const selectedMachines = Array.from(selectedCards).map(card => {
        return {
            machineId: card.getAttribute('data-machine-id'),
            renewalFee: card.querySelector('.amount').textContent
        }
    });
    
    const machineIds = selectedMachines.map(t => t.machineId);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/payment';
    form.style.display = 'none';

    form.appendChild(createHiddenInput('machineIds', JSON.stringify(machineIds)));
    form.appendChild(createHiddenInput('customerId', customerId));

    document.body.appendChild(form);
    form.submit();
}

// Create a hidden input for the POST form.
function createHiddenInput(name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    return input;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    updateSummary();
});