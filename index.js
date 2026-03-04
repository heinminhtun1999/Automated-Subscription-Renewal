// Import Libraries
const express = require('express');
const path = require('path');
const process = require('process');
const dotenv = require('dotenv');
dotenv.config();

// Import Controllers
const homeController = require('./controllers/home');
const terminalsController = require('./controllers/terminals');

// Server Setup
const app = express();
const port = process.env.PORT;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/send-email', homeController);

app.get("/terminals", terminalsController);

app.get('/return', (req, res) => {
    res.render('return', { query: req.query });
});

app.post('/payment', (req, res) => {
    res.send('Payment processing is not implemented yet. Received data: ' + JSON.stringify(req.body));
});

// TODO:: Implement email sending functionality with payment link (Partially done, bank offline transfer not done)
// TODO:: Check for the payment completion and mark  (done)
// TODO:: Setup cron job
// TODO:: Create frontend for manual create payment link
// TODO:: Implement offline banking transfer and verification
// TODO:: Implement SQLite database to store the payment initiation status, payment completion status, and other relevant information

// Start Server
app.listen(port, () => {
    console.log(`Development Server is running on ${port}`);
});


