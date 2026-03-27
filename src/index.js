// Import Libraries
const express = require('express');
const path = require('path');
const process = require('process');
const dotenv = require('dotenv');
const session = require('express-session');
dotenv.config();

// Import Controllers
const reminderEmailController = require('./controllers/reminderEmail');
const terminalsController = require('./controllers/terminals');
const paymentController = require('./controllers/payment');
const { generateAndStoreOTP, verifyOTP } = require('./controllers/otp');

// Import Middlewares
const { verifySession } = require('./middlewares/verifySession');
const e = require('express');

// Import Utilities
const logger = require('./utils/services/winston');

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
    rolling: true, // Reset maxAge on every response
    cookie: { secure: process.env.NODE_ENV === 'production' ? true : false, maxAge: 60000 * 60 } // 1 hour
}));

// Routes
app.get('/send-email', reminderEmailController);

app.get("/terminals", verifySession, terminalsController);

app.get('/return', (req, res) => {
    res.render('return', { query: req.query });
});

app.post('/payment', paymentController);

app.post('/request-otp', generateAndStoreOTP);

app.post('/verify-otp', verifyOTP);

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        statusCode: 404,
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist or has been moved.',
        details: null
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('An error occurred:', err);
    const statusCode = err.status || 500;
    const message = err.message || 'We ran into an unexpected issue while processing your request.';
    const title = err.title || 'Server Error';
    return res.status(statusCode).render('error', {
        statusCode,
        title: statusCode === 404 ? 'Not Found' : title,
        message: statusCode === 404
            ? 'The requested resource was not found.'
            : message,
        details: process.env.NODE_ENV === 'production' ? null : err.details || err.stack || err.message
    });
});

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


