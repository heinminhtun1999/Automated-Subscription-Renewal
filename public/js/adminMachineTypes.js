const machinesTypesTable = document.getElementById('machinesTypesTable');
const typeModalState = {
    initialized: false,
    modal: null,
    overlay: null,
    closeButtons: [],
    nameInput: null,
    errorText: null,
    addFieldButton: null,
    fieldsList: null,
    emptyState: null,
    saveButton: null,
    rows: []
};

const fieldsModalState = {
    initialized: false,
    modal: null,
    overlay: null,
    closeButtons: [],
    title: null,
    typeNameInput: null,
    fieldsList: null,
    emptyState: null,
    newName: null,
    newError: null,
    addButton: null,
    deleteConfirm: null,
    deleteOverlay: null,
    typeDeleteConfirm: null,
    typeDeleteOverlay: null,
    deleteTypeButton: null,
    deleteTypeName: null,
    confirmDeleteType: null,
    cancelDeleteType: null,
    confirmDelete: null,
    cancelDelete: null,
    saveButton: null,
    payload: { typeId: null, typeName: '', fields: [], row: null },
    fields: [],
    pendingDeleteIndex: null
};

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
        { extend: 'colvis', text: 'Columns', className: 'columnVisibility' },
        { extend: 'pageLength', text: 'Rows Per Page: <span class="dt-page-size">-</span>', className: 'pageLength pageSizeDisplay' },
        // { extend: 'spacer', text: '<span class="button-spacer"> | </span>', className: 'spacer' },
        // { extend: 'excel', text: '<i class="fa-solid fa-file-excel"></i>', className: 'exportExcel', titleAttr: 'Export to Excel' }
    ],
    layout: {
        topStart: 'buttons'
    },

};

let machineTypesDataTable = null;

if (machinesTypesTable) {
    machineTypesDataTable = new DataTable(machinesTypesTable, options);

    const updatePageSizeDisplay = () => {
        const buttonsRoot = machineTypesDataTable.buttons().container()[0];
        if (!buttonsRoot) return;
        const sizeEl = buttonsRoot.querySelector('.pageSizeDisplay .dt-page-size');
        if (sizeEl) {
            sizeEl.textContent = machineTypesDataTable.page.len();
        }
    };

    updatePageSizeDisplay();
    machineTypesDataTable.on('length.dt', updatePageSizeDisplay);
}

function renderTypeFieldRows() {
    if (!typeModalState.fieldsList) return;

    typeModalState.fieldsList.innerHTML = '';

    if (!typeModalState.rows.length) {
        typeModalState.emptyState?.classList.remove('hidden');
        return;
    }

    typeModalState.emptyState?.classList.add('hidden');

    typeModalState.rows.forEach((row, index) => {
        const fieldRow = document.createElement('div');
        fieldRow.className = 'grid grid-cols-[1fr_auto] gap-3 items-center rounded-lg border border-slate-200 bg-slate-50 p-3';
        fieldRow.dataset.index = String(index);
        fieldRow.innerHTML = `
            <input type="text" value="${row.name}" data-type-field-name class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" placeholder="Field name" />
            <button type="button" data-remove-type-field class="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Remove</button>
        `;
        typeModalState.fieldsList.appendChild(fieldRow);
    });
}

function openAddTypeModal() {
    const modal = document.getElementById('type-modal');
    if (!modal) return;

    if (!typeModalState.initialized) {
        typeModalState.modal = modal;
        typeModalState.overlay = modal.querySelector('[data-type-modal-overlay]');
        typeModalState.closeButtons = Array.from(modal.querySelectorAll('[data-type-modal-close]'));
        typeModalState.nameInput = modal.querySelector('[data-type-name]');
        typeModalState.errorText = modal.querySelector('[data-type-error]');
        typeModalState.addFieldButton = modal.querySelector('[data-add-type-field]');
        typeModalState.fieldsList = modal.querySelector('[data-type-fields-list]');
        typeModalState.emptyState = modal.querySelector('[data-type-empty-state]');
        typeModalState.saveButton = modal.querySelector('[data-save-type]');

        const setError = (message) => {
            if (!typeModalState.errorText) return;
            if (message) {
                typeModalState.errorText.textContent = message;
                typeModalState.errorText.classList.remove('hidden');
            } else {
                typeModalState.errorText.textContent = '';
                typeModalState.errorText.classList.add('hidden');
            }
        };

        const closeModal = () => {
            typeModalState.modal?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            typeModalState.rows = [];
            renderTypeFieldRows();
            if (typeModalState.nameInput) typeModalState.nameInput.value = '';
            setError('');
        };

        typeModalState.overlay?.addEventListener('click', closeModal);
        typeModalState.closeButtons.forEach(button => button.addEventListener('click', closeModal));

        typeModalState.addFieldButton?.addEventListener('click', () => {
            typeModalState.rows.push({ name: '' });
            renderTypeFieldRows();
        });

        typeModalState.fieldsList?.addEventListener('input', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const row = target.closest('[data-index]');
            if (!row) return;
            const index = Number(row.dataset.index);
            if (Number.isNaN(index) || !typeModalState.rows[index]) return;

            if (target.matches('[data-type-field-name]')) {
                typeModalState.rows[index].name = target.value;
            }
        });

        typeModalState.fieldsList?.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-remove-type-field]')) return;
            const row = target.closest('[data-index]');
            if (!row) return;
            const index = Number(row.dataset.index);
            if (Number.isNaN(index)) return;
            typeModalState.rows.splice(index, 1);
            renderTypeFieldRows();
        });

        typeModalState.saveButton?.addEventListener('click', async () => {
            const typeName = typeModalState.nameInput?.value.trim() || '';
            const fieldNames = typeModalState.rows.map(row => row.name.trim()).filter(Boolean);

            if (!typeName) {
                setError('Type name is required.');
                return;
            }

            try {
                const response = await fetch('/api/admin/machines/type/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type_name: typeName,
                        fields: fieldNames
                    })
                });

                const result = await window?.parseResponseData(response);

                if (result.data && machineTypesDataTable) {
                    const newType = result.data;
                    const typeData = {
                        typeId: newType.type_id,
                        typeName: newType.name,
                        fields: newType.fields
                    };
                    const encodedTypeData = JSON.stringify(typeData)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;');
                    const newRowData = [
                        machineTypesDataTable.data().rows().count() + 1,
                        newType.name,
                        newType.fields.map(field => field.name).join(", "),
                    ];
                    newRowData.push(`
                        <button class="text-emerald-500 hover:text-emerald-600 font-bold py-2 px-4 rounded"
                            onclick="manageFields(this)"
                            data-typedata="${encodedTypeData}"
                        >
                            <i class="fa-solid fa-gear fa-sm"></i> Edit
                        </button>
                    `);
                    machineTypesDataTable.row.add(newRowData).draw().node();
                    window?.renderSuccess(result.message || 'Machine type added successfully.');
                    closeModal();
                }
                return;

            } catch (error) {
                console.error('Error adding machine type:', error);
                window?.setError(error.message || 'Failed to add machine type. Please try again later.');
                return;
            }
        });

        typeModalState.initialized = true;
    }

    typeModalState.rows = [];
    typeModalState.nameInput.value = '';
    if (typeModalState.errorText) {
        typeModalState.errorText.textContent = '';
        typeModalState.errorText.classList.add('hidden');
    }
    renderTypeFieldRows();
    typeModalState.modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function manageFields(e) {
    const f = e.dataset.typedata ? JSON.parse(e.dataset.typedata) : null;

    if (!f) return;

    const initializeModal = () => {
        if (fieldsModalState.initialized) return;
        const modal = document.getElementById('fields-modal');
        if (!modal) return;

        fieldsModalState.modal = modal;
        fieldsModalState.overlay = modal.querySelector('[data-modal-overlay]');
        fieldsModalState.closeButtons = Array.from(modal.querySelectorAll('[data-modal-close]'));
        fieldsModalState.title = modal.querySelector('[data-modal-title]');
        fieldsModalState.typeNameInput = modal.querySelector('[data-manage-type-name]');
        fieldsModalState.fieldsList = modal.querySelector('[data-fields-list]');
        fieldsModalState.emptyState = modal.querySelector('[data-empty-state]');
        fieldsModalState.newName = modal.querySelector('[data-new-name]');
        fieldsModalState.newError = modal.querySelector('[data-new-error]');
        fieldsModalState.addButton = modal.querySelector('[data-add-field]');
        fieldsModalState.deleteConfirm = modal.querySelector('[data-delete-modal]');
        fieldsModalState.deleteOverlay = modal.querySelector('[data-delete-overlay]');
        fieldsModalState.confirmDelete = modal.querySelector('[data-confirm-delete]');
        fieldsModalState.cancelDelete = modal.querySelector('[data-cancel-delete]');
        fieldsModalState.saveButton = modal.querySelector('[data-save-fields]');
        fieldsModalState.typeDeleteConfirm = modal.querySelector('[data-delete-type-modal]');
        fieldsModalState.typeDeleteOverlay = modal.querySelector('[data-delete-type-overlay]');
        fieldsModalState.deleteTypeButton = modal.querySelector('[data-delete-type]');
        fieldsModalState.deleteTypeName = modal.querySelector('[data-delete-type-name]');
        fieldsModalState.confirmDeleteType = modal.querySelector('[data-confirm-delete-type]');
        fieldsModalState.cancelDeleteType = modal.querySelector('[data-cancel-delete-type]');


        const setError = (message) => {
            if (!fieldsModalState.newError) return;
            if (message) {
                fieldsModalState.newError.textContent = message;
                fieldsModalState.newError.classList.remove('hidden');
            } else {
                fieldsModalState.newError.textContent = '';
                fieldsModalState.newError.classList.add('hidden');
            }
        };

        const toggleDeleteConfirm = (show) => {
            if (!fieldsModalState.deleteConfirm) return;
            if (show) {
                fieldsModalState.deleteConfirm.classList.remove('hidden');
                fieldsModalState.deleteConfirm.classList.add('flex');
            } else {
                fieldsModalState.deleteConfirm.classList.add('hidden');
                fieldsModalState.deleteConfirm.classList.remove('flex');
            }
        };

        const toggleTypeDeleteConfirm = (show) => {
            if (!fieldsModalState.typeDeleteConfirm) return;
            if (show) {
                fieldsModalState.typeDeleteConfirm.classList.remove('hidden');
                fieldsModalState.typeDeleteConfirm.classList.add('flex');
            } else {
                fieldsModalState.typeDeleteConfirm.classList.add('hidden');
                fieldsModalState.typeDeleteConfirm.classList.remove('flex');
            }
        };

        const updateTypeRowNumbers = () => {
            if (!machineTypesDataTable) return;
            machineTypesDataTable.rows().every(function (rowIndex) {
                const rowData = this.data();
                rowData[0] = rowIndex + 1;
                this.data(rowData);
            });
            machineTypesDataTable.draw(false);
        };

        const closeModal = () => {
            fieldsModalState.modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            toggleDeleteConfirm(false);
            toggleTypeDeleteConfirm(false);
            fieldsModalState.pendingDeleteIndex = null;
            setError('');
        };

        fieldsModalState.overlay?.addEventListener('click', closeModal);
        fieldsModalState.closeButtons.forEach(button => button.addEventListener('click', closeModal));

        fieldsModalState.typeNameInput?.addEventListener('input', (event) => {
            fieldsModalState.payload.typeName.newValue = event.target.value;
        });

        fieldsModalState.addButton?.addEventListener('click', async () => {
            const nameValue = fieldsModalState.newName?.value.trim();

            if (!nameValue) {
                setError('Field name is required.');
                return;
            }

            try {
                const response = await fetch(`/api/admin/machines/type/${fieldsModalState.payload.typeId}/fields/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameValue
                    })
                });

                const result = await window?.parseResponseData(response);

                if (result.data && machineTypesDataTable) {
                    updateTableAndModal(result, fieldsModalState, machineTypesDataTable, e);
                    window?.renderSuccess(result.message || 'Fields updated successfully.');
                }

                if (fieldsModalState.newName) fieldsModalState.newName.value = '';
                setError('');
                renderFields();
                window?.renderSuccess(result.message || 'Field added successfully.');
                return;
            } catch (error) {
                console.error('Error adding field:', error);
                setError(error.message || 'Failed to add field. Please try again later.');
                return;
            }


        });

        fieldsModalState.fieldsList?.addEventListener('input', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const row = target.closest('[data-index]');
            if (!row) return;
            const index = Number(row.dataset.index);
            if (Number.isNaN(index) || !fieldsModalState.fields[index]) return;

            if (target.matches('[data-field="name"]')) {
                fieldsModalState.fields[index].name.new_value = target.value;
            }
        });

        fieldsModalState.fieldsList?.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-delete-field]')) return;
            const row = target.closest('[data-index]');
            if (!row) return;
            fieldsModalState.pendingDeleteIndex = Number(row.dataset.index);
            toggleDeleteConfirm(true);
        });

        fieldsModalState.confirmDelete?.addEventListener('click', async () => {
            const index = fieldsModalState.pendingDeleteIndex;
            if (index === null || Number.isNaN(index)) return;

            const fieldToDelete = fieldsModalState.fields[index];
            const fieldId = fieldToDelete.field_id;

            try {
                const response = await fetch(`/api/admin/machines/type/${fieldsModalState.payload.typeId}/fields/${fieldId}`,
                    {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    });

                const result = await window?.parseResponseData(response);

                if (result.data && machineTypesDataTable) {
                    updateTableAndModal(result, fieldsModalState, machineTypesDataTable, e);
                    fieldsModalState.fields.splice(index, 1);
                    window?.renderSuccess(result.message || 'Field deleted successfully.');
                }
            } catch (error) {
                console.error('Error deleting field:', error);
                window?.renderError(error.message || 'Failed to delete field. Please try again later.');
            } finally {
                fieldsModalState.pendingDeleteIndex = null;
                toggleDeleteConfirm(false);
                renderFields();
            }
        });

        fieldsModalState.cancelDelete?.addEventListener('click', () => {
            fieldsModalState.pendingDeleteIndex = null;
            toggleDeleteConfirm(false);
        });

        fieldsModalState.deleteOverlay?.addEventListener('click', () => {
            fieldsModalState.pendingDeleteIndex = null;
            toggleDeleteConfirm(false);
        });

        fieldsModalState.deleteTypeButton?.addEventListener('click', () => {
            if (fieldsModalState.deleteTypeName) {
                fieldsModalState.deleteTypeName.textContent = `Delete ${fieldsModalState.payload.typeName.oldValue}?`;
            }
            toggleTypeDeleteConfirm(true);
        });

        fieldsModalState.typeDeleteOverlay?.addEventListener('click', () => {
            toggleTypeDeleteConfirm(false);
        });

        fieldsModalState.cancelDeleteType?.addEventListener('click', () => {
            toggleTypeDeleteConfirm(false);
        });

        fieldsModalState.confirmDeleteType?.addEventListener('click', async () => {
            if (!machineTypesDataTable || !fieldsModalState.payload.row) return;

            try {
                const response = await fetch(`/api/admin/machines/type/${fieldsModalState.payload.typeId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                })

                const result = await window.parseResponseData(response);

                if (result.success) {
                    window?.renderSuccess(result.message || 'Machine type deleted successfully.');
                    machineTypesDataTable.row(fieldsModalState.payload.row).remove().draw();
                    updateTypeRowNumbers();
                    toggleTypeDeleteConfirm(false);
                    closeModal();
                }
                return;
            } catch (error) {
                console.error('Error deleting machine type:', error);
                window?.renderError(error.message || 'Failed to delete machine type. Please try again later.');
                toggleTypeDeleteConfirm(false);
                return;
            }
        });

        fieldsModalState.saveButton?.addEventListener('click', async () => {
            const changedFields = fieldsModalState.fields.filter(field => {
                const nameChanged = field.name.old_value !== field.name.new_value;
                return nameChanged;
            }).map(field => ({
                field_id: field.field_id,
                name: field.name.new_value,
            }));

            const isTypeNameChanged = fieldsModalState.payload.typeName.oldValue !== fieldsModalState.payload.typeName.newValue;

            if (!changedFields.length && !isTypeNameChanged) {
                closeModal();
                return;
            }

            try {
                const response = await fetch(`/api/admin/machines/type/${fieldsModalState.payload.typeId}/fields`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: changedFields, type_name: isTypeNameChanged ? fieldsModalState.payload.typeName.newValue : undefined })
                });

                const result = await window?.parseResponseData(response);

                if (result.data && machineTypesDataTable) {
                    updateTableAndModal(result, fieldsModalState, machineTypesDataTable, e);
                    window?.renderSuccess(result.message || 'Fields updated successfully.');
                }

            } catch (error) {
                console.error('Error updating fields:', error);
                window?.renderError(error.message || 'Failed to update fields. Please try again later.');
            } finally {
                closeModal();
                return;
            }

        });

        fieldsModalState.initialized = true;
    };

    const renderFields = () => {
        const { fieldsList, emptyState } = fieldsModalState;
        if (!fieldsList) return;
        fieldsList.innerHTML = '';
        if (!fieldsModalState.fields.length) {
            emptyState?.classList.remove('hidden');
            return;
        }
        emptyState?.classList.add('hidden');

        fieldsModalState.fields.forEach((field, index) => {
            const row = document.createElement('div');
            row.className = 'flex gap-3 items-center justify-around rounded-lg border border-slate-200 bg-white';
            row.dataset.index = String(index);
            row.innerHTML = `
                <input type="text" value="${field.name.new_value}" data-field="name" class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                <button data-delete-field class="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Delete</button>
            `;
            fieldsList.appendChild(row);
        });
    };

    initializeModal();

    if (!fieldsModalState.modal || !fieldsModalState.title || !fieldsModalState.fieldsList) return;

    fieldsModalState.payload = {
        typeId: f.typeId,
        typeName: { oldValue: f.typeName, newValue: f.typeName },
        fields: Array.isArray(f.fields) ? f.fields : [],
        row: e.closest('tr')
    };

    if (fieldsModalState.typeNameInput) {
        fieldsModalState.typeNameInput.value = fieldsModalState.payload.typeName.newValue;
    }

    fieldsModalState.fields = fieldsModalState.payload.fields
        .filter(field => field && field.name)
        .map(field => ({
            field_id: field.field_id ?? null,
            name: { old_value: String(field.name), new_value: String(field.name) }
        }));

    fieldsModalState.pendingDeleteIndex = null;
    if (fieldsModalState.newError) {
        fieldsModalState.newError.textContent = '';
        fieldsModalState.newError.classList.add('hidden');
    }
    fieldsModalState.title.textContent = `Manage Fields - ${fieldsModalState.payload.typeName.oldValue}`;
    renderFields();
    fieldsModalState.modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}


function updateTableAndModal(result, fieldsModalState, machineTypesDataTable, e) {
    const typeData = {
        typeId: fieldsModalState.payload.typeId,
        typeName: fieldsModalState.payload.typeName.newValue,
        fields: result.data.fields
    };
    const oldData = machineTypesDataTable.row(fieldsModalState.payload.row).data();
    oldData[2] = result.data.fields.map(field => field.name).join(", ");
    oldData[1] = fieldsModalState.payload.typeName.newValue;
    const encodedTypeData = JSON.stringify(typeData)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
    oldData[3] = `
                        <button class="text-emerald-500 hover:text-emerald-600 font-bold py-2 px-4 rounded"
                            onclick="manageFields(this)"
                            data-typedata="${encodedTypeData}">
                            <i class="fa-solid fa-gear fa-sm"></i> Edit
                        </button>
                    `.trim();
    machineTypesDataTable.row(fieldsModalState.payload.row).data(oldData).draw();
    fieldsModalState.payload.fields = result.data.fields;
    fieldsModalState.fields = result.data.fields.map(field => ({
        field_id: field.field_id ?? null,
        name: { old_value: String(field.name), new_value: String(field.name) }
    }));
}