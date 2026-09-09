// Import Libraries
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const { rateLimit } = require('express-rate-limit');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Controllers
const { reminderEmailController, manualReminderEmailController } = require('./controllers/reminderEmailController');
const { machineSelection } = require('./controllers/machineSelection');
const {
    requestPayment,
    paymentReturn,
    paymentCancel,
    renderPaymentCheckerPage,
    paymentCallback
} = require('./controllers/payment');
const { getOrderInfo, addManualRenewalRecord } = require('./controllers/orders');
const { renderHomePage } = require('./controllers/admin');
const { renderEmailHistoryPage } = require('./controllers/emailsHistory');
const { renderAdminOrdersPage } = require('./controllers/adminOrders');
const { renderLoginPage, handleAuth } = require('./controllers/auth');
const {
    renderMachinesPage,
    renderAddMachinePage,
    renderEditMachinePage,
    getAllMachineTypes,
    getMachinesByType,
    renderMachineTypesPage,
    handleViewMachine,
    handleAddMachine,
    handleEditMachine,
    handleDeleteMachine,
    handleAddMachineType,
    handleAddMachineTypeField,
    handleUpdateMachineTypeFields,
    handleDeleteMachineTypeField,
    handleDeleteMachineType,
    handleGetAllMachineTypesWithFields
} = require('./controllers/machines');
const {
    renderCustomersPage,
    renderAddCustomerPage,
    renderEditCustomerPage,
    handleEditCustomer,
    handleAddCustomer,
    handleViewCustomer,
    handleDeleteCustomer
} = require('./controllers/customers');

// Import Middlewares
const verifyOrigin = require('./middlewares/originCheck');
const isAuthenticated = require('./middlewares/auth');

// Rate Limiter Setup
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: 'Too many attempts. Please try again after 15 minutes.'
        });
    }
});

// Server Setup
const app = express();
const port = process.env.PORT;
app.use(express.static(path.join(process.cwd(), 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' // 
    }
}));

// Route history tracking for back button
app.use((req, res, next) => {
    //  Initialize history array if it doesn't exist
    if (!req?.session.history) {
        req.session.history = [];
    }

    // Push current URL to history, exclude certain routes like static files, API calls, and the back route itself to prevent cluttering the history
    const currentUrl = req.originalUrl;
    if (!currentUrl.startsWith('/api') &&
        !currentUrl.startsWith('/admin/back') &&
        !currentUrl.startsWith('/static') &&
        !currentUrl.includes('.') &&
        (req.session.history[req.session.history.length - 1] !== currentUrl)) {
        req.session.history.push(currentUrl);
    }

    if (req.session.history.length > 10) {
        req.session.history.shift(); // Keep only the last 10 entries
    }
    next();
});


// ================== Reconciliation in development environment ==================
// if (process.env.NODE_ENV === 'development') {
//     const runCronJobs = require('./jobs/generalJobsRunner');
//     setInterval(() => {
//         runCronJobs();
//     }, 5 * 60 * 1000); // Run every 5 minutes
// }
// ===============================================================================

app.get('/', (req, res) => {
    return res.render('home');
});


// ==== Admin Panel Routes ====

// === Rendering Routes ===

app.get('/admin/login', renderLoginPage);

app.post('/admin/login', limiter, handleAuth);

// Middleware to check if the user is authorized to access admin routes

app.use('/admin', isAuthenticated);
app.use('/api', isAuthenticated);

app.get('/admin', renderHomePage);

// Customer Routes
app.get('/admin/customers', renderCustomersPage);
app.get('/admin/customers/add', renderAddCustomerPage);
app.get('/admin/customers/:id', handleViewCustomer);
app.get('/admin/customers/:id/edit', renderEditCustomerPage);

// Machine Routes
app.get('/admin/machines', renderMachinesPage);
app.get('/admin/machines/add', renderAddMachinePage);
app.get('/admin/machines/:id', handleViewMachine);
app.get('/admin/machines/:id/edit', renderEditMachinePage);

// Machine Type Routes
app.get('/admin/machine-types/manage', renderMachineTypesPage);

// Other Admin Routes
app.get('/admin/emails-history', renderEmailHistoryPage);
app.get('/admin/orders', renderAdminOrdersPage);

// === API Routes ===
app.get('/api/admin/machines/type/:id', getMachinesByType);
app.get('/api/admin/machines/type/:id/fields', handleGetAllMachineTypesWithFields);
app.get('/api/admin/get-machine-types', getAllMachineTypes);

app.post('/api/admin/customers/add', verifyOrigin, handleAddCustomer);
app.post('/api/admin/machines/add', verifyOrigin, handleAddMachine);
app.post('/api/admin/machines/type/add', verifyOrigin, handleAddMachineType);
app.post('/api/admin/machines/type/:id/fields/add', verifyOrigin, handleAddMachineTypeField);
app.post('/api/admin/send-email', manualReminderEmailController);
app.post('/api/admin/add-manual-renewal-record', addManualRenewalRecord);

app.patch('/api/admin/customers/:id/edit', verifyOrigin, handleEditCustomer);
app.patch('/api/admin/machines/:id/edit', verifyOrigin, handleEditMachine);
app.patch('/api/admin/machines/type/:typeId/fields', verifyOrigin, handleUpdateMachineTypeFields);

app.delete('/api/admin/customers/:id', verifyOrigin, handleDeleteCustomer);
app.delete('/api/admin/machines/:id', verifyOrigin, handleDeleteMachine);
app.delete('/api/admin/machines/type/:id', verifyOrigin, handleDeleteMachineType);
app.delete('/api/admin/machines/type/:typeId/fields/:fieldId', verifyOrigin, handleDeleteMachineTypeField);
// ============================

// Routes
app.get('/send-email', reminderEmailController);

// Require verified session to access terminal list.
app.get('/machines', machineSelection);

// OTP requests and payment initiation require origin checks.
app.post('/payment', verifyOrigin, requestPayment);

app.post('/return', paymentReturn);

app.post('/callback', paymentCallback);

app.get('/cancel', paymentCancel);

app.get('/status-check', renderPaymentCheckerPage);

app.get('/get-order-info', getOrderInfo);

app.get('/admin/back', (req, res) => {
    const history = req.session.history || [];
    if (history.length > 1) {
        // Current is at length-1, Previous is at length-2
        const previousRoute = history[history.length - 2];
        // Remove the current route before redirecting so history stays clean
        history.pop();
        history.pop();

        res.redirect(previousRoute);
    } else {
        return res.redirect('/admin');
    }
});

// Disabled OTP implementation for now. Will likely reimplement in the future.
// app.post('/request-otp', verifyOrigin, generateAndStoreOTP);

// app.post('/verify-otp', verifyOrigin, verifyOTP);

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

// Start Server
app.listen(port, () => {
    console.log(`Development Server is running on ${port}: ${process.env.NODE_ENV}`);
});