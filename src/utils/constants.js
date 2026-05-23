const path = require('path');

// Map internal sheet keys to human-readable sheet names.
const SHEET_NAMES = {
    'beep': 'UID Customer List',
    'mi20': 'MI20 UID Customer List',
    'arv2.5': 'TID ARV2.5 Customer List',
    'u20': 'U20 Customer List',
    'arvdn': 'ARVDN'
};

// Reverse lookup from sheet name to internal key.
const REVERSED_SHEET_NAMES = Object.fromEntries(Object.entries(SHEET_NAMES).map(([key, value]) => [value, key]));

// Sheet-specific date column configuration.
const SHEET_CONFIGS = [
    { sheetKey: 'beep', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' },
    { sheetKey: 'mi20', endDateColumn: 'Arv Renewal End Date', renewalEndDateColumn: 'Arv Renewal End Date' },
    { sheetKey: 'arv2.5', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' },
    { sheetKey: 'u20', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' },
    { sheetKey: 'arvdn', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' }
];

// Email Due Dates
const FIRST_EMAIL_DUE_DAYS = 45;
const SECOND_EMAIL_DUE_DAYS = 7;

// Payment payload validation and status mapping.
const PAYMENT_REQUIRED_FIELDS = ['tranID', 'orderid', 'status', 'amount', 'currency', 'paydate', 'skey'];
const PAYMENT_STATUS = {
    "00": "paid",
    "11": "failed",
    "22": "pending"
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const DEFAULT_MACHINE_TYPE_MAPPING = [
    {
        'name': 'Beep',
        'fields': [
            'Machine S/N',
            'VM Model',
            'Protocol Type',
            'Location',
            'Remark' 
        ]
    },
    {
        'name': 'MI20',
        'fields': [
            'ALIAS NAME',
            'VM Model',
            'Protocol Type',
            'Location',
            'Paysys End Date',
            'Remark'
        ]
    },
    {
        'name': 'ARV2.5',
        'fields': [
            'Machine S/N',
            'VM Model',
            'Protocol Type',
            'Location',
            'Remark'
        ]
    },
    {
        'name': 'U20',
        'fields': [
            'Machine S/N',
            'VM Model',
            'Protocol Type',
            'Location',
            'Remark'
        ]
    },
    {
        'name': 'ARVDN',
        'fields': [
            'Machine S/N',
            'VM Model',
            'Protocol Type',
            'Location',
            'Remark'
        ]

    }
]

module.exports = {
    ALPHABET,
    SHEET_NAMES,
    REVERSED_SHEET_NAMES,
    SHEET_CONFIGS,
    FIRST_EMAIL_DUE_DAYS,
    SECOND_EMAIL_DUE_DAYS,
    PAYMENT_STATUS,
    PAYMENT_REQUIRED_FIELDS,
    DEFAULT_MACHINE_TYPE_MAPPING
};
