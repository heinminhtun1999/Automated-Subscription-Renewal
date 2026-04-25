const options = {
    responsive: false,
    stateSave: true,
    columnControl: ['order', 'spacer', ['orderAsc', 'orderDesc', 'spacer', 'search', 'orderClear', 'searchClear']],
    columnDefs: [
        { targets: '_all', className: 'dt-head-left' },
        {
            targets: '_all',
            createdCell: function (td, cellData, rowData, row, col) {
                if (col == 6 && cellData) {
                    const endDate = new Date(cellData);
                    const today = new Date();
                    if (endDate < today) {
                        td.classList.add('!bg-red-300');
                        td.innerHTML = cellData + ' <strong>(Expired)</strong>';
                    }
                }
                if (col == 8 && cellData) {
                    td.innerHTML = cellData === 'active'
                        ? `<span class="bg-emerald-400 rounded-full pb-3 p-2 px-5 text-white !block !ml-auto text-center border border-emerald-300">${cellData}</span>`
                        : `<span class="bg-red-400 rounded-full pb-3 p-2 px-5 text-white !block !ml-auto text-center border border-red-300">${cellData}</span>`;
                }
            }
        }
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
        { extend: 'spacer', text: '<span class="button-spacer"> | </span>', className: 'spacer' },
        { extend: 'excel', text: '<i class="fa-solid fa-file-excel"></i>', className: 'exportExcel', titleAttr: 'Export to Excel', exportOptions: { columns: ':not(.no-export)' } },
    ],
    layout: {
        topStart: 'buttons'
    },
    createdRow: function (row, data) {
        row.addEventListener('click', (e) => {
            console.log('Row clicked:', data);
            // ignore clicks on links/buttons
            if (e.target.closest('a, button')) return;
            if (data?.id) {
                window.location.href = `/admin/machines/${data.id}`;
            }
        });
    }
};

const machinesTable = document.getElementById('machinesTable');
let selectedEndDatePeriod = 'all';

const END_DATE_PERIOD_OPTIONS = [
    { value: 'all', label: 'Active Status: All' },
    { value: 'this_month', label: 'Active Status: Expire This Month' },
    { value: 'next_30_days', label: 'Active Status: Expire in Next 30 Days' },
    { value: 'next_90_days', label: 'Active Status: Expire in Next 90 Days' },
    { value: 'active', label: 'Active Status: Active (Not Expired)' },
    { value: 'expired', label: 'Active Status: Expired' }
];

let isEndDatePeriodFilterRegistered = false;

function registerEndDatePeriodFilter() {
    if (isEndDatePeriodFilterRegistered || !window.DataTable?.ext?.search) return;

    window.DataTable.ext.search.push((settings, data) => {
        if (settings?.nTable?.id !== 'machinesTable') return true;
        if (selectedEndDatePeriod === 'all') return true;

        const endDateIndex = settings.aoColumns.findIndex(col => col?.title === 'End Date');
        if (endDateIndex < 0) return true;

        const endDateRaw = data[endDateIndex];
        const endDate = parseRowDate(endDateRaw);
        if (!endDate) return false;

        return isDateWithinPeriod(endDate, selectedEndDatePeriod);
    });

    isEndDatePeriodFilterRegistered = true;
}

function parseRowDate(value) {
    if (!value || value === 'N/A') return null;

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;

    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
}

function isDateWithinPeriod(targetDate, period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);

    const next90Days = new Date(today);
    next90Days.setDate(next90Days.getDate() + 90);

    if (period === 'this_month') return targetDate >= monthStart && targetDate <= monthEnd;
    if (period === 'next_30_days') return targetDate >= today && targetDate <= next30Days;
    if (period === 'next_90_days') return targetDate >= today && targetDate <= next90Days;
    if (period === 'active') return targetDate >= today;
    if (period === 'expired') return targetDate < today;

    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        registerEndDatePeriodFilter();

        const res = await fetch('/api/admin/get-machine-types');

        const result = await window?.parseResponseData(res);
        const types = result.data || [];

        if (!types.length) {
            window?.renderError('No machine types found.');
            return;
        }
        const defaultTypeId = window.selectedMachineType || types[0].id;

        let dataTable = await createMachineTable(defaultTypeId);

        updatePageSizeDisplay(dataTable);
        dataTable.on('length.dt', () => updatePageSizeDisplay(dataTable));

        initializeMachineTypeSelector(dataTable, types, defaultTypeId);
        initializeEndDatePeriodSelector(dataTable);

    } catch (err) {
        console.error(err);
        window?.renderError('Failed to load machine types.');
    }
});


// Update page size label
function updatePageSizeDisplay(dt) {
    const root = dt.buttons().container()[0];
    if (!root) return;

    const el = root.querySelector('.pageSizeDisplay .dt-page-size');
    if (el) el.textContent = dt.page.len();
}


// Create selector ONCE only
function initializeMachineTypeSelector(dataTable, types, selectedId = null) {
    const root = dataTable.buttons().container()[0];
    if (!root) return;

    // prevent duplicate
    if (root.querySelector('#machineTypeSelect')) {
        root.querySelector('#machineTypeSelect').remove();
    };

    const select = document.createElement('select');
    select.id = 'machineTypeSelect';
    select.classList.add('machineTypeSelect');

    types.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        opt.selected = selectedId ? t.id == selectedId : i === 0;
        select.appendChild(opt);
    });

    const ref = root.querySelectorAll('.dt-button')[1];
    ref ? ref.after(select) : root.appendChild(select);

    // Only update data, NOT recreate table
    select.addEventListener('change', async (e) => {
        const typeId = e.target.value;
        const table = await updateMachineTable(dataTable, typeId);
        table.on('length.dt', () => updatePageSizeDisplay(table));
    });
}


function initializeEndDatePeriodSelector(dataTable) {
    const root = dataTable.buttons().container()[0];
    if (!root) return;

    if (root.querySelector('#endDatePeriodSelect')) {
        root.querySelector('#endDatePeriodSelect').remove();
    }

    const select = document.createElement('select');
    select.id = 'endDatePeriodSelect';
    select.classList.add('machineTypeSelect');

    END_DATE_PERIOD_OPTIONS.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        opt.selected = option.value === selectedEndDatePeriod;
        select.appendChild(opt);
    });

    const machineTypeSelect = root.querySelector('#machineTypeSelect');
    if (machineTypeSelect) {
        machineTypeSelect.after(select);
    } else {
        const ref = root.querySelectorAll('.dt-button')[1];
        ref ? ref.after(select) : root.appendChild(select);
    }

    select.addEventListener('change', (e) => {
        selectedEndDatePeriod = e.target.value;
        dataTable.draw();
    });
}


// First-time creation ONLY
async function createMachineTable(typeId, columns = null) {
    const data = await fetchMachineData(typeId);

    const c = columns || buildColumns(data);

    return new DataTable(machinesTable, {
        ...options,
        data,
        columns: c
    });
}


// Only update rows (fast & correct)
async function updateMachineTable(dataTable, typeId) {
    const data = await fetchMachineData(typeId);

    if (!data.length) {
        dataTable.clear().draw();
        return dataTable;
    }

    const newKeys = Object.keys(data[0]).filter(k => k !== 'id');

    // Get current columns (excluding No. + Action)
    const currentColumns = dataTable.settings()[0].aoColumns
        .map(col => col.data)
        .filter(d => d && d !== null && d !== 'id');

    const isSameStructure =
        JSON.stringify(newKeys.sort()) === JSON.stringify(currentColumns.sort());

    // If structure changed → FULL REBUILD
    if (!isSameStructure) {
        dataTable.state.clear();
        if (dataTable.colReorder) {
            dataTable.colReorder.reset();
        }
        dataTable.destroy();

        machinesTable.innerHTML = ``;
        const newColumns = buildColumns(data);

        const newTable = await createMachineTable(typeId, newColumns);
        updatePageSizeDisplay(newTable);
        try {
            const types = await fetchMachineTypes();
            initializeMachineTypeSelector(newTable, types, typeId);
            initializeEndDatePeriodSelector(newTable);
            newTable.draw();
        } catch (err) {
            console.error('Error re-initializing machine type selector:', err);
            window?.renderError('Failed to re-initialize machine type selector.');
        } finally {
            return newTable
        }
    }

    // If structure same → just update rows
    dataTable.clear();
    dataTable.rows.add(data);
    dataTable.draw();

    return dataTable;
}


// Fetch data helper
async function fetchMachineData(typeId) {
    const res = await fetch(`/api/admin/machines/type/${typeId}`);
    const result = await window?.parseResponseData(res);

    return result.data || [];
}


// Build columns ONCE
function buildColumns(data) {
    if (!data.length) return [];

    const cols = Object.keys(data[0])
        .filter(key => key !== 'id') // remove id from auto columns
        .map(key => {
            const isDateColumn = /date/i.test(key);

            return {
                data: key,
                title: formatTitle(key),
                ...(isDateColumn
                    ? {
                        render: (value, type) => {
                            if (type === 'sort' || type === 'type') {
                                const timestamp = Date.parse(value);
                                return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
                            }

                            return value;
                        }
                    }
                    : {})
            };
        });

    // Row number column
    cols.unshift({
        data: null,
        title: 'No.',
        render: (data, type, row, meta) => meta.row + 1
    });

    // Action column
    cols.push({
        data: 'id',
        title: 'Action',
        orderable: false,
        className: 'no-export',
        render: (id) => `
            <div>
            <a href="/admin/machines/${id}" class="text-emerald-500 hover:text-emerald-600 font-bold py-2 px-4 rounded">
                <i class="fa-solid fa-eye fa-sm"></i> View
            </a>
            <a href="/admin/machines/${id}/edit" class="text-emerald-500 hover:text-emerald-600 font-bold py-2 px-4 rounded">
                <i class="fa-solid fa-gear fa-sm"></i> Edit
            </a>
            </div>
        `
    });

    return cols;
}

async function fetchMachineTypes() {
    const res = await fetch('/api/admin/get-machine-types');

    const result = await window.parseResponseData(res);
    const types = result.data || [];

    if (!types.length) throw new Error('No machine types found. Please refresh the page.');

    return types;
}


function formatTitle(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}