// Import Libraries
const express = require('express');
const path = require('path');
const process = require('process');
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

// Import Constants
const { CREDENTIALS_PATH, SCOPES } = require('./utils/constants');

// Import Controllers
const { homeController } = require('./controllers/home');

// Server Setup
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
});

// Routes
app.get('/', (req, res) => homeController(req, res, auth, google));

app.get('/return', (req, res) => {
    res.render('return', { query: req.query });
});

// TODO:: Implement email sending functionality with payment link (Partially done, bank offline transfer not done)
// TODO:: Check for the payment completion and mark  (done)
// TODO:: Setup cron job
// TODO:: Create frontend for manual create payment link
// TODO:: Implement offline banking transfer and verification

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


