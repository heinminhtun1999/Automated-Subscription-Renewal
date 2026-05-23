const {
    getAllCustomers,
    addCustomer,
    getCustomerByEmail,
    getCustomerById,
    getCustomerByIdWithMachines,
    updateCustomer,
    deleteCustomer
} = require('../repositories/customerRepository');
const logger = require('../utils/services/winston');
const { isValidEmail } = require("../utils/utils");

// Data Processing and Validation functions
function validateRequiredFields(data, requiredFields) {
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            return `Field '${field}' is required and cannot be empty.`;
        }
    }
    return null;
}


// Controller functions
function renderCustomersPage(req, res) {
    try {
        const customers = getAllCustomers();
        return res.render('admin/customers/index', { data: customers, error: null });
    } catch (error) {
        logger.error('Error fetching customers for admin panel:', error);
        return res.render('admin/customers/index', { data: [], error: `Failed to fetch customers. Please try again later. Error: ${error.message}` });
    }
}

function handleAddCustomer(req, res) {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ success: false, message: "No customer data provided." });
    }

    const requiredFields = ['company_name', 'email', 'contact_number', 'pic_name'];
    const validationError = validateRequiredFields(body, requiredFields);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }
    
    try {

        const isCustomerExist = getCustomerByEmail(body.email);
        if (isCustomerExist) {
            return res.status(409).json({ success: false, message: "A company with this email already exists." });
        }

        const isEmailValid = isValidEmail(body.email);
        console.log(body.email, isEmailValid)
        if (!isEmailValid) {
            return res.status(400).json({ success: false, message: "Incorrect Email Format."})
        }

        const result = addCustomer(body);
        return res.status(201).json({ success: true, message: "Customer added successfully.", data: result });
    } catch (error) {
        logger.error('Error adding customer:', error);
        return res.status(500).json({ success: false, message: `Failed to add customer. Please try again later. ${error.message}` });
    }
}

function handleViewCustomer(req, res) {
    const customerId = req.params.id;

    if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    try {
        const customer = getCustomerByIdWithMachines(customerId);

        if (!customer || customer.length === 0) {
            return res.status(404).render('admin/customers/view', { data: {}, error: 'Customer not found.' });
        }

        const customerInfo = customer[0];

        const data = customer.reduce((acc, curr) => {

            return {
                ...acc,
                machines:[
                    ...acc.machines,
                    {
                        id: curr.m_id,
                        machine_id: curr.machine_id,
                        status: curr.status,
                        end_date: new Date(curr.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                        machine_type: curr.machine_type
                    }
                ]
            }

        }, {
            id: customerInfo.id,
            company_name: customerInfo.company_name,
            company_short_name: customerInfo.company_short_name,
            email: customerInfo.email,
            contact_number: customerInfo.contact_number,
            pic_name: customerInfo.pic_name,
            bank_name: customerInfo.bank_name,
            bank_account_number: customerInfo.bank_account_number,
            beneficiary_name: customerInfo.beneficiary_name,
            created_at: customerInfo.created_at,
            machines: []
        })
        return res.status(200).render('admin/customers/view', { data, error: null });

    } catch (e) {
        logger.error(`Error fetching customer with ID ${customerId}:`, e);
        return res.status(500).render('admin/customers/view', { data: {}, error: `Failed to fetch customer details. Please try again later. ${e.message}` });
    }
}

function renderAddCustomerPage(req, res) {
    return res.render('admin/customers/add');
}

function renderEditCustomerPage(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).render('admin/customers/edit', { data: {}, error: 'Customer ID is required.' });
    }

    try {
        const customer = getCustomerById(id);

        if (!customer) {
            return res.status(404).render('admin/customers/edit', { data: {}, error: 'Customer not found.' });
        }
        
        return res.status(200).render('admin/customers/edit', { data: customer, error: null });
    } catch (error) {
        logger.error(`Error fetching customer with ID ${id}:`, error);
        return res.status(500).render('admin/customers/edit', { data: {}, error: `Failed to fetch customer details. Please try again later. ${error.message}` });
    }
}

function handleEditCustomer(req, res) {

    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    const requiredFields = ['company_name', 'email', 'contact_number', 'pic_name'];
    const body = req.body;

    const validationError = validateRequiredFields(body, requiredFields);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    try {
        const existingCustomer = getCustomerById(id);
        if (!existingCustomer) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        const isEmailTaken = getCustomerByEmail(body.email);
        if (isEmailTaken && isEmailTaken.id !== parseInt(id)) {
            return res.status(409).json({ success: false, message: 'Another customer with this email already exists.' });
        }

        updateCustomer(id, body);
        return res.status(200).json({ success: true, message: 'Customer updated successfully.' });

    } catch (error) {
        logger.error(`Error updating customer with ID ${id}:`, error);
        return res.status(500).json({ success: false, message: `Failed to update customer. Please try again later. ${error.message}` });
    }
}

function handleDeleteCustomer(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Customer ID is required.' });
    }

    try {
        const existingCustomer = getCustomerById(id);
        if (!existingCustomer) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        deleteCustomer(id);
        return res.status(200).json({ success: true, message: 'Customer deleted successfully.' });
    } catch (error) {
        logger.error(`Error deleting customer with ID ${id}:`, error);
        return res.status(500).json({ success: false, message: `Failed to delete customer. Please try again later. ${error.message}` });
    }
}

module.exports = {
    renderCustomersPage,
    renderAddCustomerPage,
    handleAddCustomer,
    handleViewCustomer,
    renderEditCustomerPage,
    handleEditCustomer,
    handleDeleteCustomer
}