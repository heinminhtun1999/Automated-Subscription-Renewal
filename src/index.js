// Import Libraries
const express = require('express');
const path = require('path');
const process = require('process');
const dotenv = require('dotenv');
const session = require('express-session');
dotenv.config();

// Import Controllers
const homeController = require('./controllers/home');
const terminalsController = require('./controllers/terminals');
const { generateAndStoreOTP, verifyOTP } = require('./controllers/otp');

// Import Middlewares
const { verifySession } = require('./middlewares/verifyotp');

// Server Setup
const app = express();
const port = process.env.PORT;
app.use(express.static(path.join(process.cwd(), 'public')));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' ? true : false } 
}))

// Routes
app.get('/send-email', homeController);

app.get("/terminals", verifySession, terminalsController);

app.get('/return', (req, res) => {
    res.render('return', { query: req.query });
});

app.post('/payment', (req, res) => {
    res.send('Payment processing is not implemented yet. Received data: ' + JSON.stringify(req.body));
});

app.post('/request-otp', generateAndStoreOTP);

app.post('/verify-otp', verifyOTP);

// TODO:: Implement email sending functionality with payment link (Partially done, bank offline transfer not done)
// TODO:: Check for the payment completion and mark  (done)
// TODO:: Setup cron job
// TODO:: Create frontend for manual create payment link
// TODO:: Implement offline banking transfer and verification
// TODO:: Implement SQLite database to store the payment initiation status, payment completion status, and other relevant information

// Start Server
app.listen(port, () => {
    console.log(`Development Server is running on ${port}: ${process.env.NODE_ENV}`);
});


