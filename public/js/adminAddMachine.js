const typeSelector = document.getElementById('machine-type');
const companySuggestions = document.getElementById('company-name-search');
const companySuggestionContainer = document.getElementById('company-suggestion-container');
const companySuggestionListContainer = document.getElementById('company-name-suggestions-list');
const companyList = document.querySelectorAll('[data-company-list]');
const selectedCompanyName = document.getElementById('selected-company-name');
const selectedCustomerId = document.querySelector('[data-selected-customer-id]');
const companyDropdown = document.getElementById('company-name-dropdown');
const additionalFieldsListContainer = document.getElementById('additional-fields-list');
const addMachineSubmitButton = document.getElementById('add-machine-submit');
const machineRegistrationDateInput = document.getElementById('machine-registration-date');
const endDateInput = document.getElementById('end-date');
const feesInput = document.getElementById('subscription-fees');
const machineStatusInput = document.getElementById('machine-status');
const subscriptionPeriodInput = document.getElementById('subscription-period');
const allowRenewBtn = document.getElementById('allow-renew-after-expiration-checkbox');
const machineStatusErrorSpan = document.querySelector(`[data-error-for="machine-status"]`);

function formatDateInputValue(date) {
    if (!date) {
        return;
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatCustomerData(data) {
    return JSON.parse(data.replace(/&#34;/g, '"').replace(/&#39;/g, '\''));
}

function setMachineFieldError(fieldId, message) {
    const errorElement = document.querySelector(`[data-error-for="${fieldId}"]`);

    if (errorElement) {
        errorElement.classList.toggle('hidden', !message);
    }

    if (fieldId === 'company-name') {
        companyDropdown?.classList.toggle('border-red-400', Boolean(message));
        companyDropdown?.classList.toggle('focus:border-red-400', Boolean(message));
        companyDropdown?.classList.toggle('focus:ring-red-100', Boolean(message));
        return;
    }

    const inputElement = document.getElementById(fieldId);
    if (!inputElement) {
        return;
    }

    inputElement.classList.toggle('border-red-400', Boolean(message));
    inputElement.classList.toggle('focus:border-red-400', Boolean(message));
    inputElement.classList.toggle('focus:ring-red-100', Boolean(message));
}

function clearMachineFieldErrors() {
    setMachineFieldError('company-name', '');
    setMachineFieldError('machine-id', '');
    setMachineFieldError('subscription-fees', '');
}

function getAdditionalMachineFields() {
    if (!additionalFieldsListContainer) {
        return {};
    }

    return Array.from(additionalFieldsListContainer.querySelectorAll('input')).reduce((accumulator, input) => {
        const fieldId = input.dataset.fieldId;

        if (fieldId) {
            accumulator[fieldId] = input.value.trim();
        }

        return accumulator;
    }, {});
}


// Fetch and render company list for company dropdown with search functionality. Also handle company selection and error handling for company field.
let filteredCompanyData = [];

if (window.customersData) {
    const companyData = formatCustomerData(window.customersData);
    filteredCompanyData = companyData;

    renderCompanyList(filteredCompanyData);

    companyDropdown.addEventListener('click', () => {
        companySuggestionContainer.classList.toggle('hidden');
        companySuggestions.focus();
    });


    companySuggestions.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        filteredCompanyData = companyData.filter(company => company.company_name.toLowerCase().includes(query.toLowerCase()));
        renderCompanyList(filteredCompanyData);
    });

    function renderCompanyList(companies) {
        if (!companies || companies.length === 0) {
            companySuggestionListContainer.innerHTML = '<p class="text-gray-500 text-sm px-3">No results found.</p>';
            return;
        }

        const els = companies.map(company => {
            const isSelected = selectedCustomerId.dataset.selectedCustomerId === String(company.id);
            return `<p class="px-3 py-2 my-1 cursor-pointer hover:bg-emerald-300 hover:text-white rounded-md font-semibold text-sm ${isSelected ? 'bg-emerald-300 text-white' : ''}" data-customer-id="${company.id}" onClick="selectCompany(this)">${company.company_name}</p>`;
        });
        companySuggestionListContainer.innerHTML = els.join('');
    }

    function selectCompany(element) {
        const companyId = element.getAttribute('data-customer-id');
        const companyName = element.textContent;

        selectedCompanyName.textContent = companyName;
        selectedCompanyName.classList.remove('text-gray-500');

        const previouslySelectedCustomerId = selectedCustomerId.dataset.selectedCustomerId;

        document.querySelector(`[data-customer-id="${previouslySelectedCustomerId}"]`)?.classList.remove('bg-emerald-300', 'text-white');

        selectedCustomerId.dataset.selectedCustomerId = companyId;
        companySuggestionContainer.classList.add('hidden');
        companySuggestions.value = '';

        filteredCompanyData = formatCustomerData(window.customersData);
        renderCompanyList(filteredCompanyData);
        setMachineFieldError('company-name', '');
    }

    document.addEventListener('click', (e) => {
        if (!companyDropdown.contains(e.target) && !companySuggestionContainer.contains(e.target)) {
            companySuggestionContainer.classList.add('hidden');
        }
    });
}

// Fetch and render additional fields for selected machine type on page load and when machine type changes.
(async () => {
    if (typeSelector) {

        const renderFieldsInput = (fields) => {
            const inputEls = fields.map(field => {
                const parseName = field.name.toLowerCase().replaceAll(/[^a-zA-Z0-9 ]/g, '').split(' ').join('-');
                return `<div class="flex flex-col">
                        <label for="${parseName}" class="text-sm font-semibold text-gray-600">${field.name}</label>
                        <input type="text" name="${parseName.replaceAll('-', '_')}" id="${parseName}" data-field-id="${field.id}" class="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Enter ${field.name.toLowerCase()}">
                    </div>
            `;
            });
            additionalFieldsListContainer.innerHTML = inputEls.join('');
        };

        const typeId = typeSelector.value;
        try {
            const response = await fetch(`/api/admin/machines/type/${typeId}/fields`);
            const result = await window?.parseResponseData(response);
            const data = result.data || [];
            renderFieldsInput(data);
        } catch (error) {
            console.error('Error fetching machine type fields:', error);
            const errorToRender = 'Failed to load fields for the selected machine type. You can still add the machine with default fields, but the additional fields for the machine type won\'t be available. Please refresh the page or try again later.';
            typeSelector.insertAdjacentHTML('afterend', `<p class="text-red-500 p-1 text-sm">${errorToRender}</p>`);
        }

        typeSelector.addEventListener('change', async (e) => {
            const typeId = e.target.value;
            try {
                const response = await fetch(`/api/admin/machines/type/${typeId}/fields`);
                const result = await window?.parseResponseData(response);
                const data = result.data || [];
                renderFieldsInput(data);
            } catch (error) {
                console.error('Error fetching machine type fields:', error);
                const errorToRender = 'Failed to load fields for the selected machine type.\nYou can still add the machine with default fields, but the additional fields for the machine type won\'t be available. Please refresh the page or try again later.';
                typeSelector.insertAdjacentHTML('afterend', `<p class="text-red-500 p-1 text-sm">${errorToRender}</p>`);
            }
        });
    }
})();

// Handle machine registration date and end date inputs with default values and error handling.
if (machineRegistrationDateInput && endDateInput) {

    let userManuallyEnteredEndDate = false;

    const today = new Date();

    machineRegistrationDateInput.value = formatDateInputValue(today);

    // Auto update on active status and end date (if the end date is not selected or empty)
    machineRegistrationDateInput.addEventListener('change', (e) => {

        const selectedDate = new Date(e.target.value);
        const endDate = new Date(endDateInput.value);

        updateEndDate(endDate, selectedDate);

    });

    endDateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (isNaN(selectedDate.getTime())) {
            userManuallyEnteredEndDate = false;
            machineRegistrationDateInput.max = null;
        } else {
            userManuallyEnteredEndDate = true;
            if (selectedDate < new Date(machineRegistrationDateInput.value)) {
                machineRegistrationDateInput.value = formatDateInputValue(selectedDate);
            }
            machineRegistrationDateInput.max = selectedDate.toISOString().split('T')[0];
        }
        changeActiveStatusBasedOnDates(selectedDate);
    });

    // Auto update on active status and end date (if the end date is not selected or empty)
    subscriptionPeriodInput.addEventListener('change', (e) => {
        const selectedDate = new Date(machineRegistrationDateInput.value);
        const endDate = new Date(endDateInput.value);
        updateEndDate(endDate, selectedDate);
        e.target.value = parseInt(e.target.value);
    });

    machineStatusInput.addEventListener('change', (e) => {
        if (allowRenewBtn.checked) {
            machineStatusErrorSpan.classList.add('hidden');
            return;
        }
        ;
        const status = e.target.value;
        if (status === 'active' && (new Date(endDateInput.value).getTime() < Date.now())) {
            machineStatusErrorSpan.textContent = 'Cannot set status to active if end date is in the past. Please update the end date or change the status to inactive.';
            machineStatusErrorSpan.classList.remove('hidden');
            e.target.value = 'inactive';
            setTimeout(() => {
                machineStatusErrorSpan.classList.add('hidden');
            }, 5000);
        }
    });

    allowRenewBtn.addEventListener('change', (e) => {
        const isChecked = (e.target.checked);
        const endDate = endDateInput.value;
        if (!isChecked) {
            changeActiveStatusBasedOnDates(endDate);
        } else {
            machineStatusErrorSpan.classList.add('hidden');
        }
    });

    const changeActiveStatusBasedOnDates = (date) => {
        if (allowRenewBtn.checked) {
            return;
        }
        const today = new Date();

        const isActive = formatDateInputValue(date) >= formatDateInputValue(today);
        machineStatusInput.value = isActive ? 'active' : 'inactive';
    };

    const updateEndDate = (endDate, selectedDate) => {
        if (!userManuallyEnteredEndDate && !endDateInput.value) {
            const subscriptionPeriod = Number(subscriptionPeriodInput.value) || 1;
            const n_endDate = new Date(selectedDate);
            n_endDate.setFullYear(
                n_endDate.getFullYear() + subscriptionPeriod
            );
            endDateInput.value = formatDateInputValue(n_endDate);
        }
    };
}


// Handle add machine form submission with validation, error handling and success handling.
if (addMachineSubmitButton && typeSelector) {
    addMachineSubmitButton.addEventListener('click', async () => {
        clearMachineFieldErrors();

        const machineTypeId = typeSelector.value.trim();
        const customerId = selectedCustomerId?.dataset.selectedCustomerId?.trim() || '';
        const machineIdInput = document.getElementById('machine-id');
        const subscriptionFeesInput = document.getElementById('subscription-fees');
        const subscriptionPeriodInput = document.getElementById('subscription-period');
        const registrationDateInput = document.getElementById('machine-registration-date');
        const endDateInput = document.getElementById('end-date');
        const allowRenewalBtn = document.getElementById('allow-renew-after-expiration-checkbox');

        const machineId = machineIdInput?.value.trim() || '';
        const subscriptionFees = subscriptionFeesInput?.value.trim() || '';
        const subscriptionPeriod = subscriptionPeriodInput?.value.trim() || '';
        const status = machineStatusInput?.value.trim() || 'active';
        const registeredDate = registrationDateInput?.value ? formatDateInputValue(registrationDateInput.value) : formatDateInputValue(new Date());
        const endDate = formatDateInputValue(endDateInput?.value);
        const allowRenewalValue = allowRenewalBtn.checked;

        let isValid = true;

        if (!machineTypeId) {
            window?.renderError('Machine type is required.');
            return;
        }

        if (!customerId) {
            setMachineFieldError('company-name', 'Customer\'s company name is required.');
            isValid = false;
        }

        if (!machineId) {
            setMachineFieldError('machine-id', 'Machine id is required.');
            isValid = false;
        }

        if (!subscriptionFees || Number.isNaN(Number(subscriptionFees))) {
            setMachineFieldError('subscription-fees', 'Enter a valid subscription fee.');
            isValid = false;
        }

        if (!subscriptionPeriod || Number.isNaN(Number(subscriptionPeriod))) {
            setMachineFieldError('subscription-period', 'Enter a valid subscription period.');
            isValid = false;
        }

        if (status === 'active' && (endDate < formatDateInputValue(new Date())) && !allowRenewalValue) {
            setMachineFieldError('machine-status', 'Cannot set status to active if end date is in the past. Please update the end date or change the status to inactive.');
            isValid = false;
        }

        if (!isValid) {
            window?.renderError('Please fix the highlighted fields before continuing.');
            return;
        }

        const body = {
            machine_type_id: Number(machineTypeId),
            customer_id: Number(customerId),
            machine_id: machineId,
            subscription_fees: Number(subscriptionFees),
            subscription_period: Number(subscriptionPeriod),
            allow_renew_after_expiration: allowRenewalValue,
            registered_date: registeredDate,
            end_date: endDate,
            additional_fields: getAdditionalMachineFields(),
            status
        };
        const originalButtonText = addMachineSubmitButton.textContent;
        addMachineSubmitButton.disabled = true;
        addMachineSubmitButton.textContent = 'Adding...';

        try {
            const response = await fetch('/api/admin/machines/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const result = await window?.parseResponseData(response);
            window?.renderSuccess(result.message || 'Machine added successfully.');
            window.location.href = '/admin/machines';
        } catch (error) {
            console.error('Error submitting add machine form:', error);

            if (error.message === 'Machine ID already exists. Please choose a different Machine ID.') {
                setMachineFieldError('machine-id', 'This Machine ID already exists. Please choose a different Machine ID.');
                window?.renderError(error.message);
                return;
            } else {
                window?.renderError(error.message || 'Failed to add machine. Please try again later.');
            }
        } finally {
            addMachineSubmitButton.disabled = false;
            addMachineSubmitButton.textContent = originalButtonText;
        }
    });
}

// ==============
// Miscellaneous
// ==============

// Clear error message for each field on input
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value) {
            setMachineFieldError(e.target.id, '');
        }
    });
});

// Subscription fees input: auto round to 2 decimal places on blur and prevent negative values.
feesInput?.addEventListener('blur', (e) => {
    const value = parseFloat(e.target.value);
    if (!Number.isNaN(value)) {
        e.target.value = value.toFixed(2);
    }
    if (value < 0) {
        e.target.value = Math.abs(value).toFixed(2);
    }
});