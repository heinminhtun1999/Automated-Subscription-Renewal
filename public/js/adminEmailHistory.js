const emailHistoryTable = document.getElementById('emailHistoryTable');

const modalIds = {
    root: 'emailHistoryDetailsModal',
    closeButton: 'emailHistoryDetailsClose',
    title: 'emailHistoryDetailsTitle',
    subtitle: 'emailHistoryDetailsSubtitle',
    summary: 'emailHistoryDetailsSummary',
    tableBody: 'emailHistoryDetailsBody'
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const flattenMachinesData = (emailData) => {
    const renewedMachines = emailData?.machines?.renewed || [];
    const pendingRenewalMachines = emailData?.machines?.pendingRenewal || [];

    return [...renewedMachines, ...pendingRenewalMachines].map((machine) => ({
        machine_id: machine?.machine_id ?? '-',
        machine_type: machine?.machine_type ?? '-',
        first_email_id: machine?.first_email_id ?? '-',
        first_email_sent_date: emailData?.sent_date ?? '-',
        second_email_id: machine?.second_email_id ?? '-',
        second_email_sent_date: machine?.second_email_sent_date ?? '-',
        renewal_status: machine?.payment_status === 'paid' ? 'renewed' : 'renewal pending',
        order_id: machine?.order_id ?? '-'
    }));
};

const createEmailHistoryDetailsModal = () => {
    const existingModal = document.getElementById(modalIds.root);
    if (existingModal) {
        return existingModal;
    }

    const modal = document.createElement('div');
    modal.id = modalIds.root;
    modal.className = 'hidden fixed inset-0 z-[1200] bg-gray-900/60 flex items-center justify-center p-4 md:p-6';
    modal.innerHTML = `
        <div class="w-full max-w-[1200px] p-[1px] rounded-2xl bg-gradient-to-br " role="dialog" aria-modal="true" aria-labelledby="${modalIds.title}">
            <div class="max-h-[88vh] rounded-2xl overflow-hidden bg-white flex flex-col">
                <div class="flex items-start justify-between gap-4 px-5 py-4 md:px-6 bg-gradient-to-r ">
                    <div>
                        <h3 id="${modalIds.title}" class="m-0 text-lg font-semibold tracking-tight ">Email Details</h3>
                        <p id="${modalIds.subtitle}" class="mt-1 text-sm ">Machine-level renewal details</p>
                    </div>
                    <button id="${modalIds.closeButton}" type="button" class="w-10 h-10 leading-9 text-2xl border border-white/40 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close modal">&times;</button>
                </div>

                <div class="px-5 py-3 md:px-6 bg-slate-50 border-b border-slate-200">
                    <div id="${modalIds.summary}" class="flex flex-wrap gap-2"></div>
                </div>

                <div class="px-5 py-5 md:px-6 overflow-auto bg-gradient-to-b from-white to-slate-50/70">
                    <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table class="w-full min-w-[980px] text-sm">
                            <thead class="bg-slate-100/90">
                                <tr>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">machine_id</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">machine_type</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">first_email_id</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">first_email_sent_date</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">second_email_id</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">second_email_sent_date</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">renewal status</th>
                                    <th class="border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wide text-left whitespace-nowrap px-3 py-2.5">order_id</th>
                                </tr>
                            </thead>
                            <tbody id="${modalIds.tableBody}" class="divide-y divide-slate-100"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeButton = modal.querySelector(`#${modalIds.closeButton}`);
    closeButton?.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });

    return modal;
};

const openEmailHistoryDetailsModal = (emailData) => {
    const modal = createEmailHistoryDetailsModal();
    const titleElement = modal.querySelector(`#${modalIds.title}`);
    const subtitleElement = modal.querySelector(`#${modalIds.subtitle}`);
    const summaryElement = modal.querySelector(`#${modalIds.summary}`);
    const tableBody = modal.querySelector(`#${modalIds.tableBody}`);

    if (!tableBody) {
        return;
    }
    const data = JSON.parse(emailData);
    const rowId = String(data?.id || '');
    const machineRows = flattenMachinesData(data);

    const renewedCount = machineRows.filter((machine) => machine.renewal_status === 'renewed').length;
    const pendingRenewalCount = machineRows.length - renewedCount;

    if (summaryElement) {
        summaryElement.innerHTML = `
            <span class="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold">Total: ${machineRows.length}</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">Renewed: ${renewedCount}</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">Pending Renewal: ${pendingRenewalCount}</span>
        `;
    }

    tableBody.innerHTML = machineRows.length
        ? machineRows.map((machine) => `
            <tr class="bg-white even:bg-slate-50/65 hover:bg-emerald-50/70 transition-colors">
                <td class="text-sm text-slate-800 text-left whitespace-nowrap px-3 py-2.5 font-medium">${escapeHtml(machine.machine_id)}</td>
                <td class="text-sm text-slate-700 text-left whitespace-nowrap px-3 py-2.5">${escapeHtml(machine.machine_type)}</td>
                <td class="text-sm text-slate-700 text-left whitespace-nowrap px-3 py-2.5">${escapeHtml(machine.first_email_id)}</td>
                <td class="text-sm text-slate-700 text-left whitespace-nowrap px-3 py-2.5">${escapeHtml(machine.first_email_sent_date)}</td>
                <td class="text-sm text-slate-700 text-left whitespace-nowrap px-3 py-2.5">${escapeHtml(machine.second_email_id)}</td>
                <td class="text-sm text-slate-700 text-left whitespace-nowrap px-3 py-2.5">${escapeHtml(machine.second_email_sent_date)}</td>
                <td class="text-sm text-left whitespace-nowrap px-3 py-2.5">
                    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${machine.renewal_status === 'renewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-700'}">${escapeHtml(machine.renewal_status)}</span>
                </td>
                <td class="text-sm text-slate-700 text-left whitespace-nowrap px-3 py-2.5">${escapeHtml(machine.order_id)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="8" class="text-sm text-center text-gray-500 whitespace-nowrap px-3 py-8">No machine details found.</td></tr>';

    if (titleElement) {
        titleElement.textContent = `Email ${rowId || ''} machine details`;
    }

    if (subtitleElement) {
        const recipient = emailData?.recipient_email ? `Recipient: ${emailData.recipient_email}` : 'Recipient unavailable';
        const sentDate = emailData?.sent_date ? ` | Sent: ${emailData.sent_date}` : '';
        subtitleElement.textContent = `${recipient}${sentDate}`;
    }

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
};

const colResizeOptions = {
    isEnabled: true,
    saveState: false,
    hoverClass: 'dt-colresizable-hover',
    hasBoundCheck: true,
    minBoundClass: 'dt-colresizable-bound-min',
    maxBoundClass: 'dt-colresizable-bound-max',
    onResizeEnd: function () {
        if (emailHistoryDataTable) {
            emailHistoryDataTable.columns.adjust();
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
            targets: 1,
            render: (value, type) => {
                if (!value || typeof value !== 'string' || value.trim() === '') {
                    return ""; // Places empty cells at the bottom
                }

                if (type === 'sort' || type === 'type') {
                    // Standardize AM/PM format for JS native parser
                    let cleanValue = value.replace(/am/i, 'AM').replace(/pm/i, 'PM').trim();

                    // Handle DD/MM/YYYY vs YYYY-MM-DD
                    if (cleanValue.includes('/')) {
                        // Convert "DD/MM/YYYY, HH:mm:ss AM" to "YYYY-MM-DD HH:mm:ss AM"
                        const [datePart, timePart] = cleanValue.split(', ');
                        const [day, month, year] = datePart.split('/');
                        cleanValue = `${year}-${month}-${day} ${timePart}`;
                    }

                    const timestamp = Date.parse(cleanValue);
                    return Number.isNaN(timestamp) ? Number.MIN_SAFE_INTEGER : timestamp;
                }

                return value;
            }
        }
    ],
    ordering: true,
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
    },
    // createdRow: function (row, data) {
    //     row.classList.add('cursor-pointer');
    //     row.addEventListener('click', (e) => {
    //         if (e.target.closest('a, button, input, select, textarea, label')) {
    //             return;
    //         }

    //         const emailData = readEmailDataFromRow(row);
    //         if (!emailData) {
    //             return;
    //         }

    //         openEmailHistoryDetailsModal(emailData, row.dataset.rowId);
    //     });
    // }
}

let emailHistoryDataTable = null;

if (emailHistoryTable && emailHistoryTable.querySelector('tbody tr[data-row-id]')) {
    emailHistoryDataTable = new DataTable(emailHistoryTable, options);

    const updatePageSizeDisplay = () => {
        const buttonsRoot = emailHistoryDataTable.buttons().container()[0];
        if (!buttonsRoot) return;
        const sizeEl = buttonsRoot.querySelector('.pageSizeDisplay .dt-page-size');
        if (sizeEl) {
            sizeEl.textContent = emailHistoryDataTable.page.len();
        }
    };

    updatePageSizeDisplay();
    emailHistoryDataTable.on('length.dt', updatePageSizeDisplay);
    emailHistoryDataTable.columns.adjust();

    const filterState = {
        renewal: 'all',
        reminder: 'all'
    };

    const getMachineSummary = (row) => {
        const emailData = row.dataset?.emailData ? JSON.parse(row.dataset.emailData) : null;
        const machines = emailData?.machines || { renewed: [], pendingRenewal: [] };
        const paidMachines = (machines.renewed || []).filter((machine) => machine && machine.machine_id);
        const pendingRenewalMachines = (machines.pendingRenewal || []).filter((machine) => machine && machine.machine_id);
        const rowId = String(row?.dataset?.rowId || '');
        return {
            paidCount: paidMachines.length,
            pendingRenewalCount: pendingRenewalMachines.length,
            isFirstReminder: [...paidMachines, ...pendingRenewalMachines].some((machine) => String(machine.first_email_id) === rowId)
        };
    };

    DataTable.ext.search.push((settings, data, dataIndex) => {
        if (settings.nTable !== emailHistoryTable) {
            return true;
        }

        const row = settings.aoData?.[dataIndex]?.nTr;
        if (!row) {
            return true;
        }

        const summary = getMachineSummary(row);
        let passRenewal = true;
        let passReminder = true;

        if (filterState.renewal === 'pendingRenewal') {
            passRenewal = summary.pendingRenewalCount > 0;
        } else if (filterState.renewal === 'renewed') {
            passRenewal = summary.paidCount > 0 && summary.pendingRenewalCount === 0;
        }

        if (filterState.reminder === 'first') {
            passReminder = summary.isFirstReminder;
        }

        return passRenewal && passReminder;
    });

    const createSelect = ({ className, label, title, options }) => {
        const group = document.createElement('div');
        group.className = 'dt-email-history-filterGroup';

        const select = document.createElement('select');
        select.className = `machineTypeSelect dt-email-history-filterSelect ${className || ''}`.trim();
        select.setAttribute('aria-label', label);
        if (title) {
            select.title = title;
        }

        options.forEach((option) => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            if (option.title) {
                opt.title = option.title;
            }
            select.appendChild(opt);
        });

        group.appendChild(select);

        return { group, select };
    };

    const buttonsRoot = emailHistoryDataTable.buttons().container()[0];
    if (buttonsRoot) {
        const filtersWrap = document.createElement('div');
        filtersWrap.className = 'dt-email-history-filters';
        filtersWrap.style.order = '3';
        filtersWrap.style.display = 'flex';
        filtersWrap.style.gap = '10px';

        const renewalFilter = createSelect({
            className: 'dt-email-history-renewalFilter',
            label: 'Renewal status',
            options: [
                { value: 'all', text: 'Renewal status: All entries' },
                { value: 'renewed', text: 'Renewed' },
                { value: 'pendingRenewal', text: 'Pending renewal' }
            ]
        });

        const reminderFilter = createSelect({
            className: 'dt-email-history-reminderFilter',
            label: 'Reminder type',
            title: 'Shows only emails sent for the first time for a machine.',
            options: [
                { value: 'all', text: 'Reminder type: All entries' },
                { value: 'first', text: 'First reminder only', title: 'Shows only emails sent for the first time for a machine.' }
            ]
        });

        renewalFilter.select.addEventListener('change', () => {
            filterState.renewal = renewalFilter.select.value;
            emailHistoryDataTable.draw();
        });

        reminderFilter.select.addEventListener('change', () => {
            filterState.reminder = reminderFilter.select.value;
            emailHistoryDataTable.draw();
        });

        reminderFilter.select.value = 'all';
        emailHistoryDataTable.draw(false);

        filtersWrap.appendChild(renewalFilter.group);
        filtersWrap.appendChild(reminderFilter.group);

        const colVisButton = buttonsRoot.querySelector('.columnVisibility');
        const pageSizeButton = buttonsRoot.querySelector('.pageSizeDisplay');
        const spacerButton = buttonsRoot.querySelector('.dt-button-spacer');
        const exportButton = buttonsRoot.querySelector('.exportExcel');

        if (colVisButton) colVisButton.style.order = '1';
        if (pageSizeButton) pageSizeButton.style.order = '2';
        if (filtersWrap) filtersWrap.style.order = '3';
        if (spacerButton) spacerButton.style.order = '4';
        if (exportButton) exportButton.style.order = '5';

        if (spacerButton && spacerButton.parentNode === buttonsRoot) {
            buttonsRoot.insertBefore(filtersWrap, spacerButton);
        } else {
            buttonsRoot.appendChild(filtersWrap);
        }
    }
}