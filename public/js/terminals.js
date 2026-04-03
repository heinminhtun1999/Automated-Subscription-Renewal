// Toggle terminal selection
function toggleTerminal(element) {
    const isDisabled = element.getAttribute('data-terminal-disabled') === 'true';
    if (isDisabled) return; // Do not allow selection if terminal is expired
    element.classList.toggle('selected');
    updateSummary();
}

// Clear all selected terminals
function clearSelected() {
    const selected = document.querySelectorAll('.terminal-item.selected');
    selected.forEach(card => card.classList.remove('selected'));
    updateSummary();
}

// Update summary information
function updateSummary() {
    const selectedCards = document.querySelectorAll('.terminal-item.selected');
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
    const selectedCards = document.querySelectorAll('.terminal-item.selected');
    const companyName = document.getElementById('company-name').textContent.trim();

    if (selectedCards.length === 0) {
        alert('Please select at least one terminal before proceeding to payment.');
        return;
    }

    // Collect selected terminal data
    const selectedTerminals = Array.from(selectedCards).map(card => {
        return {
            terminalId: card.getAttribute('data-terminal-id'),
            renewalFee: card.querySelector('.amount').textContent
        }
    });


    const terminalIds = selectedTerminals.map(t => t.terminalId);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/payment';
    form.style.display = 'none';

    form.appendChild(createHiddenInput('terminalIds', JSON.stringify(terminalIds)));
    form.appendChild(createHiddenInput('companyName', companyName));

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