const { getMachinesByTypeDB } = require('../repositories/machineRepository');
const {
    getAllType,
    getAllMachineTypesWithFields,
    getMachineTypeByIdWithFields,
    addMachineType,
    updateMachineTypeName,
    getMachineTypeByName,
    getMachineTypeById,
    deleteMachineType
} = require('../repositories/machineTypeRepository');
const {
    getMachineTypeFields,
    addMachineTypeFieldDB,
    updateMachineTypeFields,
    deleteMachineTypeField
} = require('../repositories/machineTypeFieldsRepository');
const {
    getMachineByMachineIdOrId,
    addMachine,
    deleteMachine,
    updateMachine
} = require('../repositories/machineRepository');
const {
    getAllCustomers,
    getCustomerById
} = require('../repositories/customerRepository');
const {
    updateEmailMachine,
    getEmailMachineByMachineId
} = require('../repositories/emailMachinesRepository');
const db = require('../db/db');
const logger = require('../utils/services/winston');
const { formatDate, normalizeDate, checkRequiredFields } = require('../utils/utils');

// Data Processing functions
function prepareMachineData(machine) {
    const fields = getMachineTypeFields(machine.machine_type_id);
    const jsonData = JSON.parse(machine.data);
    delete machine.data;

    const additionalData = {};
    fields.forEach(field => {
        additionalData[field.name] = jsonData[field.id] || null;
    });

    const data = {
        "id": machine.id,
        "Machine ID": machine.machine_id,
        "Type": machine.machine_type_name,
        "Company Name": machine.company_name,
        "PIC Name": machine.pic_name,
        "Registered Date": formatDate(machine.registered_date),
        "End Date": formatDate(machine.end_date),
        "Subscription Fees": "RM " + machine.subscription_fees.toFixed(2),
        "Status": machine.status,
        "Last Renewal Date": machine.last_renewal_date ? formatDate(machine.last_renewal_date) : 'N/A',
        "Renewal Count": machine.renewal_count,
        "type_id": machine.machine_type_id,
        "customer_id": machine.customer_id,
        ...additionalData
    }
    return data;
}

function filterAdditionalFields(machineTypeId, additional_fields) {
    const additionalFields = getMachineTypeFields(machineTypeId).map(field => field.id);
    const columnsFromBody = Object.keys(additional_fields);
    const filteredAdditionalFields = columnsFromBody.filter(key => additionalFields.includes(parseInt(key)));
    const additionalDataObject = {};

    filteredAdditionalFields.forEach(fieldId => {
        additionalDataObject[fieldId] = additional_fields[fieldId] || null;
    });

    return additionalDataObject
}

function forceCheckActiveStatusBasedOnEndDate(status, endDate) {
    const isExpired = new Date(endDate).getTime() < Date.now();

    if (isExpired) return 'inactive';

    return status === 'inactive' ? 'inactive' : 'active';
}

// =============== Controller functions ===============
function renderMachinesPage(req, res) {
    const { message, selected_machine_type } = req.query;
    if (message) {
        return res.render('admin/machines/index', { success: true, message, selectedMachineType: selected_machine_type });
    }
    return res.render('admin/machines/index', { selectedMachineType: selected_machine_type });
}

function renderAddMachinePage(req, res) {

    try {
        const types = getAllType();
        const customers = getAllCustomers();
        return res.render('admin/machines/add', { data: { types, customers }, error: null });
    } catch (e) {
        logger.error('Error rendering add machine page:', e);
        return res.render('admin/machines/add', { data: null, error: 'Failed to load add machine page. Please try again later.' });
    }
}

function renderEditMachinePage(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).render('admin/machines/edit', { data: {}, error: 'Machine ID is required.' });
    }

    try {
        const machine = getMachineByMachineIdOrId(id);

        if (!machine) {
            return res.status(404).render('admin/machines/edit', { data: {}, error: 'Machine not found.' });
        }

        const machineData = prepareMachineData(machine);
        const types = getAllType();
        const customers = getAllCustomers();

        const data = {
            machine: machineData,
            types,
            customers
        }

        return res.status(200).render('admin/machines/edit', { data, error: null });
    } catch (error) {
        logger.error('Error fetching machine:', error);
        return res.status(500).render('admin/machines/edit', { data: {}, error: 'Failed to fetch machine. Please try again later.' });
    }
    return;
}

function getMachinesByType(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ data: [], success: false, message: 'Machine type ID is required.' });
        }

        const fields = getMachineTypeFields(id);
        let data = getMachinesByTypeDB(id);
        data = data.map(machine => {
            const jsonData = JSON.parse(machine.data);
            const jsonDataKeys = Object.keys(jsonData);
            delete machine.data;

            const formattedObject = {
                "id": machine.id,
                "Machine ID": machine.machine_id,
                "Type": machine.machine_type_name,
                "Company Name": machine.company_name,
                "PIC Name": machine.pic_name,
                "Registered Date": formatDate(machine.registered_date),
                "End Date": formatDate(machine.end_date),
                "Subscription Fees": "RM " + machine.subscription_fees.toFixed(2),
                "Status": machine.status
            }

            const additionalFields = {};
            fields.forEach(field => {
                const fieldName = field.name;
                additionalFields[fieldName] = jsonData[field.id] || null;
            });

            return { ...formattedObject, ...additionalFields };
        })
        return res.status(200).json({ data, success: true });
    } catch (error) {
        logger.error('Error fetching machines for admin panel:', error);
        return res.status(500).json({ data: [], success: false, message: `Failed to fetch machines. Please try again later. Error: ${error.message}` });
    }
}

function getAllMachineTypes(req, res) {
    try {
        const data = getAllType();
        return res.status(200).json({ data, success: true });
    } catch (error) {
        logger.error('Error fetching machine types:', error);
        return res.status(500).json({ data: [], success: false, message: `Failed to fetch machine types. Please try again later. Error: ${error.message}` });
    }
}

function handleGetAllMachineTypesWithFields(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, data: {}, message: 'Machine type ID is required.' });
    }

    try {
        const data = getMachineTypeFields(id);
        return res.status(200).json({ success: true, data, message: 'Machine type with fields fetched successfully.' });
    } catch (error) {
        logger.error('Error fetching machine type with fields:', error);
        return res.status(500).json({ success: false, data: {}, message: `Failed to fetch machine type with fields. Please try again later. Error: ${error.message}` });
    }
}

function renderMachineTypesPage(req, res) {
    try {
        const data = getAllMachineTypesWithFields();

        return res.render('admin/machines/manageTypes', { data, error: null });
    } catch (error) {
        logger.error('Error rendering machine types management page:', error);
        return res.render('admin/machines/manageTypes', { data: [], error: `Failed to load machine types management page. Please try again later. Error: ${error.message}` });
    }
}

function handleViewMachine(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).render('admin/machines/view', { data: {}, error: 'Machine ID is required.' });
    }

    try {
        const machine = getMachineByMachineIdOrId(id);

        if (!machine) {
            return res.status(404).render('admin/machines/view', { data: {}, error: 'Machine not found.' });
        }

        const data = prepareMachineData(machine);

        const prevURL = req.get('Referer').includes('/admin/machines') ? `/admin/machines` : req.get('Referer');
        return res.status(200).render('admin/machines/view', { data, error: null, prevURL });
    } catch (error) {
        logger.error('Error fetching machine:', error);
        return res.status(500).render('admin/machines/view', { data: {}, error: 'Failed to fetch machine. Please try again later.' });
    }
}

function handleAddMachine(req, res) {

    const {
        machine_type_id,
        customer_id,
        machine_id,
        registered_date,
        end_date,
        subscription_fees,
        status,
        additional_fields
    } = req.body;

    const requiredFieldCheck = checkRequiredFields(body, ['machine_type_id', 'customer_id', 'end_data', 'subscription_fees', 'machine_id']);
    if (!requiredFieldCheck.valid) {
        const missingField = requiredFieldsCheck.missingField;
        logger.warn(`Missing ${missingField} in handleAddMachine:`, body);
        return res.status(400).send(`Missing required field: ${missingField}`);
    }

    try {
        const existingMachine = getMachineByMachineIdOrId(machineId = req.body.machine_id);
        if (existingMachine) {
            return res.status(400).json({ success: false, message: 'A machine with the same Machine ID already exists. Please choose a different Machine ID.' });
        }

        const existingType = getMachineTypeById(machine_type_id);
        if (!existingType) {
            return res.status(400).json({ success: false, message: 'Selected machine type does not exist.' });
        }

        const existingCustomer = getAllCustomers().find(customer => customer.id === parseInt(customer_id));
        if (!existingCustomer) {
            return res.status(400).json({ success: false, message: 'Selected company does not exist.' });
        }

        const additionalDataObject = filterAdditionalFields(machine_type_id, additional_fields);

        const isRegisteredDateValid = !registered_date || isNaN(new Date(registered_date).getTime());

        const registeredDate = isRegisteredDateValid ? new Date() : new Date(registered_date);
        const calculatedEndDate = end_date ? end_date : new Date(registeredDate.getTime() + (1000 * 60 * 60 * 24 * 365));

        const finalStatus = forceCheckActiveStatusBasedOnEndDate(status, calculatedEndDate);

        const dataToInsert = {
            machine_type_id,
            customer_id,
            machine_id,
            registered_date: new Date(registeredDate).toISOString(),
            end_date: new Date(calculatedEndDate).toISOString(),
            subscription_fees,
            status: finalStatus,
            data: JSON.stringify(additionalDataObject)
        }
        addMachine(dataToInsert);
        return res.status(200).json({ success: true, message: 'Machine added successfully.' });
    } catch (error) {
        logger.error('Error adding machine:', error);
        return res.status(500).json({ success: false, message: `Failed to add machine. Please try again later. Error: ${error.message}` });
    }
    return;
}

function handleEditMachine(req, res) {
    const { id } = req.params;
    const body = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Machine ID is required.' });
    }

    try {

        const requiredFieldCheck = checkRequiredFields(body, ['machine_type_id', 'customer_id', 'machine_id', 'subscription_fees']);
        if (!requiredFieldCheck.valid) {
            const missingField = requiredFieldsCheck.missingField;
            logger.warn(`Missing ${missingField} in handleAddMachine:`, body);
            return res.status(400).send(`Missing required field: ${missingField}`);
        }

        const existingMachine = getMachineByMachineIdOrId(id);
        if (!existingMachine) {
            return res.status(404).json({ success: false, message: 'Machine not found.' });
        }

        const existingCustomer = getCustomerById(body.customer_id);
        if (!existingCustomer) {
            return res.status(400).json({ success: false, message: 'Selected customer\'s company does not exist.' });
        }

        const existingMachineType = getMachineTypeById(body.machine_type_id);
        if (!existingMachineType) {
            return res.status(400).json({ success: false, message: 'Selected machine type does not exist.' });
        }

        const additionalDataObject = filterAdditionalFields(body.machine_type_id, body.additional_fields);

        const isEditingRegisteredDateValid = body.registered_date && !isNaN(new Date(body.registered_date).getTime());
        const registeredDate = isEditingRegisteredDateValid ? new Date(body.registered_date) : existingMachine.registered_date;

        const isEditingEndDateValid = body.end_date && !isNaN(new Date(body.end_date).getTime());
        const calculatedEndDate = isEditingEndDateValid ? new Date(body.end_date) : existingMachine.end_date;

        const finalStatus = forceCheckActiveStatusBasedOnEndDate(body.status || existingMachine.status, calculatedEndDate);

        const shouldRemoveRenewalProcessId = existingMachine.customer_id !== existingCustomer.id;

        const machineDataToUpdate = {
            machine_type_id: body.machine_type_id,
            customer_id: body.customer_id,
            machine_id: body.machine_id,
            registered_date: new Date(registeredDate).toISOString(),
            end_date: new Date(calculatedEndDate).toISOString(),
            subscription_fees: body.subscription_fees,
            status: finalStatus,
            data: JSON.stringify(additionalDataObject),
            renewal_process_id: shouldRemoveRenewalProcessId ? null : finalStatus == 'inactive' ? null : existingMachine.renewal_process_id
        }
        updateMachine(id, machineDataToUpdate);
        return res.status(200).json({ success: true, message: 'Machine updated successfully.' });
    } catch (error) {
        logger.error('Error editing machine:', error);
        return res.status(500).json({ success: false, message: `Failed to edit machine. Please try again later. Error: ${error.message}` });
    }

}

function handleDeleteMachine(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Machine ID is required.' });
    }

    try {
        const existingMachine = getMachineByMachineIdOrId(id);
        if (!existingMachine) {
            return res.status(404).json({ success: false, message: 'Machine not found.' });
        }

        deleteMachine(id);
        return res.status(200).json({ success: true, message: 'Machine deleted successfully.' });
    } catch (error) {
        logger.error('Error deleting machine:', error);
        return res.status(500).json({ success: false, message: `Failed to delete machine. Please try again later. Error: ${error.message}` });
    }
}

function handleAddMachineTypeField(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Machine type ID is required.' });
    }

    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Machine type name is required.' });
        }

        const existingFields = getMachineTypeFields(id);
        const duplicate = existingFields.some(field => field.name.toLowerCase() === name.toLowerCase());
        addMachineTypeFieldDB(id, { name: duplicate ? `${name} (Duplicate)` : name });
        const data = getMachineTypeByIdWithFields(id);
        return res.status(200).json({ success: true, data, message: 'Machine type field added successfully.' });
    } catch (error) {
        logger.error('Error adding machine type field:', error);
        return res.status(500).json({ success: false, message: `Failed to add machine type field. Please try again later. Error: ${error.message}` });
    }
}

function handleUpdateMachineTypeFields(req, res) {

    const { typeId } = req.params;
    if (!typeId) {
        return res.status(400).json({ success: false, message: 'Machine type ID is required.' });
    }

    const { fields, type_name } = req.body;

    if ((!fields || !Array.isArray(fields) || fields.length === 0) && !type_name) {
        return res.status(400).json({ success: false, message: 'Fields data is required and should be a non-empty array.' });
    }

    try {

        const existingFields = getMachineTypeFields(typeId);

        db.transaction((fields) => {

            if (type_name) {
                updateMachineTypeName(typeId, type_name);
            }

            if (fields.length > 0) {
                for (const field of fields) {
                    const duplicateName = existingFields.some(existingField => existingField.name.toLowerCase() === field.name.toLowerCase() && existingField.field_id !== field.field_id);
                    updateMachineTypeFields(typeId, { ...field, name: duplicateName ? `${field.name} (Duplicate)` : field.name });
                }
            }
        }).immediate(fields);

        const data = getMachineTypeByIdWithFields(typeId);

        return res.status(200).json({ success: true, data, message: 'Machine type fields updated successfully.' });
    } catch (error) {
        logger.error('Error updating machine type fields:', error);
        return res.status(500).json({ success: false, message: `Failed to update machine type fields. Please try again later. Error: ${error.message}` });
    }

}

function handleDeleteMachineTypeField(req, res) {
    const { typeId, fieldId } = req.params;

    if (!typeId || !fieldId) {
        return res.status(400).json({ success: false, message: 'Machine type ID and field ID are required.' });
    }

    try {
        deleteMachineTypeField(typeId, fieldId);
        const data = getMachineTypeByIdWithFields(typeId);
        return res.status(200).json({ success: true, data, message: 'Machine type field deleted successfully.' });
    } catch (error) {
        logger.error('Error deleting machine type field:', error);
        return res.status(500).json({ success: false, message: `Failed to delete machine type field. Please try again later. Error: ${error.message}` });
    }
}

function handleDeleteMachineType(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Machine type ID is required.' });
    }

    try {
        const existingType = getMachineTypeById(id);

        if (!existingType) {
            return res.status(404).json({ success: false, message: 'Machine type not found.' });
        }

        deleteMachineType(id);
        return res.status(200).json({ success: true, message: 'Machine type deleted successfully.' });
    } catch (error) {
        logger.error('Error deleting machine type:', error);
        return res.status(500).json({ success: false, message: `Failed to delete machine type. Please try again later. Error: ${error.message}` });
    }
}

function handleAddMachineType(req, res) {
    const { type_name, fields } = req.body;

    if (!type_name) {
        return res.status(400).json({ success: false, message: 'Machine type name is required.' });
    }
    try {

        const existingType = getMachineTypeByName(type_name);
        if (existingType) {
            return res.status(400).json({ success: false, message: 'A machine type with the same name already exists. Please choose a different name.' });
        }


        let lastInsertRowid;
        db.transaction(() => {
            lastInsertRowid = addMachineType(type_name).lastInsertRowid;

            if (fields && Array.isArray(fields) && fields.length > 0) {
                for (const fieldName of fields) {
                    addMachineTypeFieldDB(lastInsertRowid, fieldName);
                }
            }
        }).immediate();

        const data = getMachineTypeByIdWithFields(lastInsertRowid);
        return res.status(200).json({ success: true, data, message: 'Machine type added successfully.' });

    } catch (error) {
        logger.error('Error adding machine type:', error);
        return res.status(500).json({ success: false, message: `Failed to add machine type. Please try again later. Error: ${error.message}` });
    }
}

module.exports = {
    renderMachinesPage,
    getMachinesByType,
    getAllMachineTypes,
    renderMachineTypesPage,
    renderEditMachinePage,
    handleViewMachine,
    handleAddMachine,
    handleEditMachine,
    handleDeleteMachine,
    handleAddMachineTypeField,
    handleUpdateMachineTypeFields,
    handleDeleteMachineTypeField,
    handleAddMachineType,
    handleDeleteMachineType,
    renderAddMachinePage,
    handleGetAllMachineTypesWithFields
}