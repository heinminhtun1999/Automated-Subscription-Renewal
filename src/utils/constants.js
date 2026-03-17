const path = require('path');

const SHEET_NAMES = {
    'beep': 'UID Customer List',
    'mi20': 'MI20 UID Customer List',
    'arv2.5': 'TID ARV2.5 Customer List',
    'u20': 'U20 Customer List',
    'arvdn': 'ARVDN'
};

const SHEET_CONFIGS = [
    { sheetKey: 'beep', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' },
    { sheetKey: 'mi20', endDateColumn: 'Paysys End Date', renewalEndDateColumn: 'Arv Renewal End Date' },
    { sheetKey: 'arv2.5', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' },
    { sheetKey: 'u20', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' },
    { sheetKey: 'arvdn', endDateColumn: 'End Date', renewalEndDateColumn: 'Renewal End Date' }
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Google API Scopes and Credentials Path
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const RANGE = ['UID Customer List!A1:Z', 'MI20 UID Customer List!A1:Z', 'TID ARV2.5 Customer List!A1:Z', 'U20 Customer List!A1:Z', 'ARVDN!A1:Z'];

// Email Due Dates
const FIRST_EMAIL_DUE_DAYS = 45;
const SECOND_EMAIL_DUE_DAYS = 7;

module.exports = { SCOPES, CREDENTIALS_PATH, RANGE, ALPHABET, SHEET_NAMES, SHEET_CONFIGS, FIRST_EMAIL_DUE_DAYS, SECOND_EMAIL_DUE_DAYS };
