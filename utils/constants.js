const path = require('path');

const SHEET_NAMES = {
    'beep': 'UID Customer List',
    'mi20': 'MI20 UID Customer List',
    'arv2.5': 'TID ARV2.5 Customer List',
    'u20': 'U20 Customer List'
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Google API Scopes and Credentials Path
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const RANGE = ['UID Customer List!A1:Z', 'MI20 UID Customer List!A1:Z', 'TID ARV2.5 Customer List!A1:Z', 'U20 Customer List!A1:Z'];

module.exports = { SCOPES, CREDENTIALS_PATH, RANGE, alphabet, SHEET_NAMES };
