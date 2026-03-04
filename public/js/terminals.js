// Toggle terminal selection
function toggleTerminal(element) {
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
    const customerName = document.getElementById('customer-name').textContent;

    if (selectedCards.length === 0) {
        alert('Please select at least one terminal before proceeding to payment.');
        return;
    }

    // Collect selected terminal data
    const selectedTerminals = Array.from(selectedCards).map(card => {
        return {
            terminalId: card.getAttribute('data-terminal-id'),
            daysLeft: card.querySelector('.detail-col:nth-child(1) .value').textContent,
            renewalFee: card.querySelector('.amount').textContent
        }
    });

    const totalFee = selectedTerminals.reduce((sum, terminal) => {
        const fee = parseFloat(terminal.renewalFee.replace(/[^0-9.]/g, ''));
        return sum + fee;
    }, 0);



    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/payment';
    form.style.display = 'none';

    // form.appendChild(createHiddenInput('selectedTerminals', JSON.stringify(selectedTerminals)));

    document.body.appendChild(form);
    form.submit();
}

function createHiddenInput(value) {

}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    updateSummary();
});