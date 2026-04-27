const saveBtn = document.getElementById('save-customer-submit');
const customerIdInput = document.getElementById('customer-id');

function setError(input, message) {
    const errorEl = document.querySelector(`[data-error-for="${input.id}"]`);
    if (errorEl) {
        if (message) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        } else {
            errorEl.classList.add('hidden');
        }
    }
}

saveBtn.addEventListener('click', async () => {
    const customerId = customerIdInput.value;
    
    if (!customerId) return;

    const companyNameInput = document.getElementById('company-name');
    const companyShortNameInput = document.getElementById('company-short-name');
    const emailInput = document.getElementById('email');
    const contactNumberInput = document.getElementById('contact-number');
    const picNameInput = document.getElementById('pic-name');
    const bankNameInput = document.getElementById('bank-name');
    const bankAccountNumberInput = document.getElementById('bank-account-number');
    const beneficiaryNameInput = document.getElementById('beneficiary-name');

    const companyName = companyNameInput.value.trim();
    const companyShortName = companyShortNameInput.value.trim();
    const email = emailInput.value.trim();
    const contactNumber = contactNumberInput.value.trim();
    const picName = picNameInput.value.trim();
    const bankName = bankNameInput.value.trim();
    const bankAccountNumber = bankAccountNumberInput.value.trim();
    const beneficiaryName = beneficiaryNameInput.value.trim();

    if (!companyName) {
        setError(companyNameInput, "Company name is required.");
        return;
    }

    if (!email) {
        setError(emailInput, "Email is required.");
        return;
    }

    if (!contactNumber) {
        setError(contactNumberInput, "Contact number is required.");
        return;
    }

    if (!picName) {
        setError(picNameInput, "PIC name is required.");
        return;
    }

    const body = {
        company_name: companyName,
        company_short_name: companyShortName,
        email,
        contact_number: contactNumber,
        pic_name: picName,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        beneficiary_name: beneficiaryName
    }

    const originalButtonText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        const response = await fetch(`/api/admin/customers/${customerId}/edit`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = window.parseResponseData(response);
        
        window.renderSuccess(result.message || 'Customer updated successfully.');
        window.location.href = `/admin/customers/${customerId}`;
    } catch (e) {
        window.renderError(e.message || 'Failed to update customer. Please try again later.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalButtonText;
    }

});

// Clear error message for each field on input
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value) {
            setError(e.target, '');
        }
    });
});