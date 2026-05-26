const typeSelector = document.getElementById('machine-type');
const additionalFieldsListContainer = document.getElementById('additional-fields-list');
const saveButton = document.getElementById('save-machine-submit');
const companyDropdown = document.getElementById('company-name-dropdown');
const machineRegistrationDateInput = document.getElementById('machine-registration-date');
const endDateInput = document.getElementById('end-date');
const companySuggestionContainer = document.getElementById('company-suggestion-container');
const companySuggestionListContainer = document.getElementById('company-name-suggestions-list');
const companySuggestions = document.getElementById('company-name-search');
const selectedCompanyName = document.getElementById('selected-company-name');
const selectedCustomerId = document.querySelector('[data-selected-customer-id]');
const machineStatusInput = document.getElementById('machine-status');

let areMachineFieldsValid = true;

function formatData(data) {
    return JSON.parse(data.replace(/&#34;/g, '"').replace(/&#39;/g, "'"));
}

function formatDate(dateString) {
    const d = new Date(dateString);
    return isNaN(d)
        ? dateString
        : new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];
};

function formatDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getAdditionalMachineFields() {
    if (!additionalFieldsListContainer) return {};

    return Array.from(additionalFieldsListContainer.querySelectorAll('input')).reduce((accumulator, input) => {
        const fieldId = input.dataset.fieldId;

        if (fieldId) {
            accumulator[fieldId] = input.value.trim();
        }

        return accumulator;
    }, {});
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
    if (!inputElement) return;

    inputElement.classList.toggle('border-red-400', Boolean(message));
    inputElement.classList.toggle('focus:border-red-400', Boolean(message));
    inputElement.classList.toggle('focus:ring-red-100', Boolean(message));
}

function clearMachineFieldErrors() {
    setMachineFieldError('company-name', '');
    setMachineFieldError('machine-id', '');
    setMachineFieldError('subscription-fees', '');
}

async function fetchMachineTypeFields(typeId) {
    try {
        const response = await fetch(`/api/admin/machines/type/${typeId}/fields`);
        const result = await window.parseResponseData(response);
        return result.data || [];
    } catch (error) {
        console.error('Error fetching machine type fields:', error);
        throw new Error("Failed to load fields for the selected machine type. You can still add the machine with default fields, but the additional fields for the machine type won't be available. Please refresh the page or try again later.");
        typeSelector.insertAdjacentHTML('afterend', `<p class="text-red-500 p-1 text-sm">${errorToRender}</p>`);
    }
}

if (window.data) {
    const data = formatData(window.data);
    const machine = data.machine;
    const customerData = data.customers || [];

    filteredCustomerData = customerData;
    renderCompanyList(filteredCustomerData);

    companyDropdown.addEventListener('click', () => {
        companySuggestionContainer.classList.toggle('hidden');
        companySuggestions.focus();
    });


    companySuggestions.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        filteredCustomerData = customerData.filter(customer => customer.company_name.toLowerCase().includes(query.toLowerCase()));
        renderCompanyList(filteredCustomerData);
    });

    function renderCompanyList(customers) {
        if (!customers || customers.length === 0) {
            companySuggestionListContainer.innerHTML = '<p class="text-gray-500 text-sm px-3">No results found.</p>';
            return;
        }

        const els = customers.map(customer => {
            const isSelected = selectedCustomerId.dataset.selectedCustomerId === String(customer.id);
            return `<p class="px-3 py-2 my-1 cursor-pointer hover:bg-emerald-300 hover:text-white rounded-md font-semibold text-sm ${isSelected ? 'bg-emerald-300 text-white' : ''}" data-customer-id="${customer.id}" onClick="selectCompany(this)">${customer.company_name}</p>`;
        })
        companySuggestionListContainer.innerHTML = els.join('');
    }

    function selectCompany(element) {
        const customerId = element.getAttribute('data-customer-id');
        const companyName = element.textContent;

        selectedCompanyName.textContent = companyName;
        selectedCompanyName.classList.remove('text-gray-500');

        const previouslySelectedCustomerId = selectedCustomerId.dataset.selectedCustomerId;

        document.querySelector(`[data-customer-id="${previouslySelectedCustomerId}"]`)?.classList.remove('bg-emerald-300', 'text-white');

        selectedCustomerId.dataset.selectedCustomerId = customerId;
        companySuggestionContainer.classList.add('hidden');
        companySuggestions.value = '';

        filteredCustomerData = customerData;
        renderCompanyList(filteredCustomerData);
        setMachineFieldError('company-name', '');
    }

    document.addEventListener('click', (e) => {
        if (!companyDropdown.contains(e.target) && !companySuggestionContainer.contains(e.target)) {
            companySuggestionContainer.classList.add('hidden');
        }
    });

    // Fetch and render additional fields for selected machine type on page load and when machine type changes.
    (async () => {
        if (typeSelector) {

            const renderFieldsInput = (fields) => {
                const inputEls = fields.map(field => {
                    const parseName = field.name.toLowerCase().replaceAll(/[^a-zA-Z0-9 ]/g, "").split(" ").join("-");
                    return `<div class="flex flex-col">
                        <label for="${parseName}" class="text-sm font-semibold text-gray-600">${field.name}</label>
                        <input type="text" name="${parseName.replaceAll("-", "_")}" id="${parseName}" data-field-id="${field.id}" class="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Enter ${field.name.toLowerCase()}" value="${machine[field.name] || ''}">
                    </div>
            `;
                })
                additionalFieldsListContainer.innerHTML = inputEls.join('');
            }

            const typeId = typeSelector.value;
            const fields = await fetchMachineTypeFields(typeId);
            renderFieldsInput(fields);

            typeSelector.addEventListener('change', async (e) => {
                const typeId = e.target.value;
                const fields = await fetchMachineTypeFields(typeId);
                renderFieldsInput(fields);
            });
        }
    })();

    if (saveButton && typeSelector) {
        saveButton.addEventListener('click', async () => {
            clearMachineFieldErrors();
            areMachineFieldsValid = true;
            const machineTypeId = typeSelector.value.trim();
            const customerId = selectedCustomerId?.dataset.selectedCustomerId?.trim() || '';
            const machineIdInput = document.getElementById('machine-id');
            const subscriptionFeesInput = document.getElementById('subscription-fees');
            const registrationDateInput = document.getElementById('machine-registration-date');
            const endDateInput = document.getElementById('end-date');

            const machineId = machineIdInput?.value.trim() || '';
            const subscriptionFees = subscriptionFeesInput?.value.trim() || '';
            const status = machineStatusInput?.value.trim() || 'active';
            const registeredDate = registrationDateInput?.value || formatDateInputValue(new Date());
            const endDate = endDateInput?.value || formatDateInputValue(new Date(new Date(registeredDate).getTime() + (1000 * 60 * 60 * 24 * 365)));

            if (!machineTypeId) return;

            if (!customerId) {
                setMachineFieldError('company-name', "Customer's company name is required.");
                areMachineFieldsValid = false;
            }

            if (!machineId) {
                setMachineFieldError('machine-id', 'Machine id is required.');
                areMachineFieldsValid = false;
            }

            if (!subscriptionFees || Number.isNaN(Number(subscriptionFees))) {
                setMachineFieldError('subscription-fees', 'Enter a valid subscription fee.');
                areMachineFieldsValid = false;
            }

            if (!areMachineFieldsValid) {
                window.renderError('Please fix the highlighted fields before continuing.');
                return;
            }

            const body = {
                machine_type_id: Number(machineTypeId),
                customer_id: Number(customerId),
                machine_id: machineId,
                subscription_fees: Number(subscriptionFees),
                status,
                registered_date: registeredDate,
                end_date: endDate,
                additional_fields: getAdditionalMachineFields()
            };
            const originalButtonText = saveButton.textContent;
            saveButton.disabled = true;
            saveButton.textContent = 'Updating...';

            try {
                const response = await fetch(`/api/admin/machines/${machine.id}/edit`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                const result = await window.parseResponseData(response);
                window.renderSuccess(result.message || 'Machine updated successfully.');
                window.location.href = `/admin/machines/${machine.id}`;
            } catch (e) {
                console.error('Error submitting add machine form:', e);

                if (e.message === 'Machine ID already exists. Please choose a different Machine ID.') {
                    setMachineFieldError('machine-id', 'This Machine ID already exists. Please choose a different Machine ID.');
                    window.renderError(e.message);
                    return;
                } else {
                    window.renderError?.(e.message || 'Failed to add machine. Please try again later.');
                }
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = originalButtonText;
            }
        });
    }
}

// Handle machine regestration date and end date inputs with default values and error handling.
if (machineRegistrationDateInput && endDateInput && machineStatusInput) {

    machineRegistrationDateInput.addEventListener('change', (e) => {
        
        const selectedDate = new Date(e.target.value).getTime();
        const endDate = new Date(endDateInput.value).getTime();
        
        if (selectedDate > endDate) {
            endDateInput.value = formatDate(selectedDate);
            changeActiveStatusBasedOnDates(selectedDate);
            return;
        }

        if (isNaN(endDate)) {
            const oneYear = 1000 * 60 * 60 * 24 * 365;
            const calculateEndDate = new Date(selectedDate + oneYear);
            endDateInput.value = formatDate(calculateEndDate);
            changeActiveStatusBasedOnDates(calculateEndDate);
            return;
        } 
    });

    endDateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value).getTime();
        changeActiveStatusBasedOnDates(selectedDate);
    });

    machineStatusInput.addEventListener('change', (e) => {
        const status = e.target.value;
        const machineStatusErrorSpan = document.querySelector(`[data-error-for="machine-status"]`);
        if (status === 'active' && (new Date(endDateInput.value).getTime() < Date.now())) {
            machineStatusErrorSpan.textContent = 'Cannot set status to active if end date is in the past. Please update the end date or change the status to inactive.';
            machineStatusErrorSpan.classList.remove('hidden');
            e.target.value = 'inactive';
            areMachineFieldsValid = false;
            setTimeout(() => {
                machineStatusErrorSpan.classList.add('hidden');
                machineStatusErrorSpan.textContent = '';
                areMachineFieldsValid = true
            }, 5000);
        } else {
            machineStatusErrorSpan.classList.add('hidden');
            machineStatusErrorSpan.textContent = '';
            areMachineFieldsValid = true;
        }
    });

    const changeActiveStatusBasedOnDates = (date) => {
        const isActive = date > Date.now();
        console.log(date, Date.now(), isActive);
        machineStatusInput.value = isActive ? 'active' : 'inactive';
    }
}



