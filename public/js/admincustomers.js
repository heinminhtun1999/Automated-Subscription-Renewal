const customerTable = document.getElementById('customerTable');

const options = {
    responsive: false,
    stateSave: false,
    columnControl: ['order', 'spacer', ['orderAsc', 'orderDesc', 'spacer', 'search', 'orderClear', 'searchClear']],
    columnDefs: [
        { targets: '_all', className: 'dt-head-left' }
    ],
    ordering: {
        indicators: false,
        handler: false
    },
    scrollX: true,
    fixedHeader: true,
    buttons: [
        { 'extend': 'colvis', 'text': 'Columns', className: 'columnVisibility' },
        { 'extend': 'pageLength', 'text': 'Rows Per Page: <span class="dt-page-size">-</span>', className: 'pageLength pageSizeDisplay' },
        { 'extend': 'spacer', 'text': '<span class="button-spacer"> | </span>', className: 'spacer' },
        { 'extend': 'excel', 'text': '<i class="fa-solid fa-file-excel"></i>', className: 'exportExcel', titleAttr: 'Export to Excel', exportOptions: { columns: ':not(.no-export)' } },
    ],
    layout: {
        topStart: 'buttons'
    },
    createdRow: function (row, data) {
        row.addEventListener('click', (e) => {
            // ignore clicks on links/buttons
            if (e.target.closest('a, button')) return;
            if (row.dataset.rowId) {
                window.location.href = `/admin/customers/${row.dataset.rowId}`;
            }
        });
    }
}

if (customerTable) {
    const customerDataTable = new DataTable(customerTable, options);

    const updatePageSizeDisplay = () => {
        const buttonsRoot = customerDataTable.buttons().container()[0];
        if (!buttonsRoot) return;
        const sizeEl = buttonsRoot.querySelector('.pageSizeDisplay .dt-page-size');
        if (sizeEl) {
            sizeEl.textContent = customerDataTable.page.len();
        }
    };

    updatePageSizeDisplay();
    customerDataTable.on('length.dt', updatePageSizeDisplay);
}

const addCustomerForm = document.getElementById('add-customer-form');
const addCustomerSubmit = document.getElementById('add-customer-submit');
const addCustomerAlert = document.getElementById('add-customer-alert');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s-]{6,}$/;

function setFieldError(input, message) {
    const errorEl = document.querySelector(`[data-error-for="${input.id}"]`);
    if (errorEl) {
        if (message) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        } else {
            errorEl.classList.add('hidden');
        }
    }
    input.classList.toggle('border-red-400', Boolean(message));
    input.classList.toggle('focus:border-red-400', Boolean(message));
    input.classList.toggle('focus:ring-red-100', Boolean(message));
}

function validateAddCustomerField(input) {
    if (!input) return true;
    const value = input.value.trim();
    const isRequired = input.dataset.required === 'true';
    const type = input.dataset.type;

    if (isRequired && !value) {
        setFieldError(input, 'This field is required.');
        return false;
    }

    if (value && type === 'email' && !emailPattern.test(value)) {
        setFieldError(input, 'Enter a valid email.');
        return false;
    }

    if (value && type === 'phone' && !phonePattern.test(value)) {
        setFieldError(input, 'Enter a valid contact number.');
        return false;
    }

    setFieldError(input, '');
    return true;
}

if (addCustomerForm && addCustomerSubmit) {
    const fields = Array.from(addCustomerForm.querySelectorAll('input'));

    fields.forEach((field) => {
        field.addEventListener('input', () => validateAddCustomerField(field));
        field.addEventListener('blur', () => validateAddCustomerField(field));
    });

    addCustomerSubmit.addEventListener('click', async () => {
        let isValid = true;
        fields.forEach((field) => {
            if (!validateAddCustomerField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            addCustomerAlert.textContent = 'Please fix the highlighted fields before continuing.';
            addCustomerAlert.classList.remove('hidden');
            addCustomerAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        addCustomerAlert.classList.add('hidden');

        const body = fields.reduce((acc, field) => {
            return {
                ...acc,
                [field.name]: field.value.trim()
            }
        }, {})

        try {
            const response = await fetch('/api/admin/customers/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            })

            const data = await window?.parseResponseData(response);
            window?.renderSuccess(data.message || 'Customer added successfully!');
            window.location = '/admin/customers';
        } catch (error) {
            console.error('Error submitting add customer form:', error);
            if (window?.renderError) {
                window?.renderError(error.message || 'Failed to add customer. Please try again later.');
            } else if (addCustomerAlert) {
                addCustomerAlert.textContent = error.message || 'Failed to add customer. Please try again later.';
                addCustomerAlert.classList.remove('hidden');
                addCustomerAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}