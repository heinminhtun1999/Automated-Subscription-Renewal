const orderTable = document.getElementById('orderTable');

const colResizeOptions = {
    isEnabled: true,
    saveState: false,
    hoverClass: 'dt-colresizable-hover',
    hasBoundCheck: true,
    minBoundClass: 'dt-colresizable-bound-min',
    maxBoundClass: 'dt-colresizable-bound-max',
    onResizeEnd: function () {
        if (orderDataTable) {
            orderDataTable.columns.adjust();
        }
    }
}

const options = {
    autoWidth: false,
    responsive: false,
    stateSave: false,
    colResize: colResizeOptions,
    columnControl: ['order', 'spacer', ['orderAsc', 'orderDesc', 'spacer', 'search', 'orderClear', 'searchClear']],
    columnDefs: [
        { targets: '_all', className: 'dt-head-left' },
        {
            targets: '_all',
            createdCell: function (td, cellData, rowData, row, col) {

                if (cellData) {
                    el = null;
                    if (col === 5) {
                        if (cellData === 'pending') el = `<span class=" text-yellow-500">${cellData}</span>`;
                        else if (cellData === 'paid') el = `<span class=" text-emerald-500">${cellData}</span>`;
                        else el = `<span class=" text-red-500">${cellData}</span>`;
                    } else if (col === 6) {
                        if (cellData === 'pending') el = `<span class=" text-yellow-500">${cellData}</span>`;
                        else if (cellData === 'processing') el = `<span class=" text-blue-500">${cellData}</span>`;
                        else if (cellData === 'completed') el = `<span class=" text-emerald-500">${cellData}</span>`;
                        else el = `<span class=" text-red-500">${cellData}</span>`;
                    }
                    td.innerHTML = el || cellData;
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
        { 'extend': 'colvis', 'text': 'Columns', className: 'columnVisibility' },
        { 'extend': 'pageLength', 'text': 'Rows Per Page: <span class="dt-page-size">-</span>', className: 'pageLength pageSizeDisplay' },
        { 'extend': 'spacer', 'text': '<span class="button-spacer"> | </span>', className: 'spacer' },
        { 'extend': 'excel', 'text': '<i class="fa-solid fa-file-excel"></i>', className: 'exportExcel', titleAttr: 'Export to Excel' },
    ],
    layout: {
        topStart: 'buttons'
    }
}

let orderDataTable = null;

if (orderTable && orderTable.querySelector('tbody tr[data-row-id]')) {
    orderDataTable = new DataTable(orderTable, options);

    const updatePageSizeDisplay = () => {
        const buttonsRoot = orderDataTable.buttons().container()[0];
        if (!buttonsRoot) return;
        const sizeEl = buttonsRoot.querySelector('.pageSizeDisplay .dt-page-size');
        if (sizeEl) {
            sizeEl.textContent = orderDataTable.page.len();
        }
    };

    updatePageSizeDisplay();
    orderDataTable.on('length.dt', updatePageSizeDisplay);
    orderDataTable.columns.adjust();
}