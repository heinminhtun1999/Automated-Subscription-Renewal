// Import Libraries
const express = require('express');
const path = require('path');
const process = require('process');
const dotenv = require('dotenv');
const session = require('express-session');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Controllers
const reminderEmailController = require('./controllers/reminderEmail');
const terminalsController = require('./controllers/terminals');
const { requestPayment, paymentReturn, paymentCancel, renderPamentCheckerPage, paymentCallback } = require('./controllers/payment');
const { generateAndStoreOTP, verifyOTP } = require('./controllers/otp');
const { getOrderInfo } = require('./controllers/orders');

// Import Middlewares
const { verifySession } = require('./middlewares/verifySession');
const verifyOrigin = require('./middlewares/originCheck');

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
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every response
    cookie: {
        secure: process.env.NODE_ENV === 'production' ? true : false,
        maxAge: 60000 * 60, // 1 hour
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'strict' // 
    }
}));

// Routes
app.get('/send-email', reminderEmailController);

// Require verified session to access terminal list.
app.get('/terminals', verifySession, terminalsController);

// OTP requests and payment initiation require origin checks.
app.post('/payment', verifyOrigin, requestPayment);

app.post('/return', paymentReturn);

app.post('/callback', paymentCallback);

app.get('/cancel', paymentCancel);

app.get('/payment-status', renderPamentCheckerPage);

app.get('/get-order-info', getOrderInfo);

app.post('/request-otp', verifyOrigin, generateAndStoreOTP);

app.post('/verify-otp', verifyOrigin, verifyOTP);

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
// TODO:: Implement offline banking transfer and verification
// TODO:: Implement CSRF protection for POST routes

// Start Server
app.listen(port, () => {
    console.log(`Development Server is running on ${port}: ${process.env.NODE_ENV}`);
});


