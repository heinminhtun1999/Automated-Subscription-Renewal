const path = require("path");
const Database = require("better-sqlite3");
const dbPath = path.join(__dirname, "..", "src", "db", "database.db");
const db = new Database(dbPath);

const data = require("./data.json");
const { register } = require("module");

function seedCustomers(customerData) {
    const stmt = `
        INSERT INTO customers (
            company_name,
            company_short_name,
            email,
            contact_number,
            pic_name,
            bank_name,
            bank_account_number,
            beneficiary_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return db.prepare(stmt).run(
        customerData.company_name,
        customerData.company_short_name,
        customerData.email,
        customerData.contact_number,
        customerData.pic_name,
        customerData.bank_name,
        customerData.bank_account_number,
        customerData.beneficiary_name
    );
}

function seedMachines(machineData) {
    const fields = Object.keys(machineData).map(key => `${key}`).join(", ");
    const values = Object.values(machineData);

    const stmt = `
        INSERT INTO machines (${fields})
        VALUES (${Array.from({ length: values.length }, () => "?").join(", ")})
    `;
    return db.prepare(stmt).run(...values);
}

function seedData() {

    try {
        db.transaction(() => {
            for (const row of data) {

                const notNullValues = Object.values(row).filter(value => value !== null && value !== undefined);
                if (notNullValues.length <= 1) {
                    console.warn(`Skipping row with all null values: ${JSON.stringify(row)}`);
                    continue;
                }

                let customer = db.prepare(`SELECT id FROM customers WHERE email = ? OR company_name = ?`).get(row["Email Address"], row["Company Name"]);

                const customerData = {
                    company_name: row["Company Name"],
                    company_short_name: row["Company Short Name"],
                    email: row["Email Address"],
                    contact_number: row["Contact Number"] || "0123456789",
                    pic_name: row["PIC"] || "John Doe",
                    bank_name: row["Bank Name"],
                    bank_account_number: row["Bank Account"],
                    beneficiary_name: row["Beneficiary Name"] 
                }
                
                if (!customer) {
                    customer = seedCustomers(customerData);
                }
    
                const machineType = db.prepare(`SELECT id FROM machine_types WHERE name = ?`).get(row["Sheet"]);
                
                if (!machineType) {
                    throw new Error(`Machine type not found for sheet: ${row["Sheet"]}`);
                }

                const machineTypeFields = db.prepare(`SELECT id, name FROM machine_type_fields WHERE machine_type_id = ?`).all(machineType.id);
                const map = new Map()

                for (const field of machineTypeFields) {
                    const key = field.name;
                    map.set(key, field.id);
                }

                const filteredFieldsData = Object.keys(row).reduce((acc, value) => {
                    const fieldId = map.get(value);
                    acc[fieldId] = row[value];
                    return acc;
                }, {});

                const machineId = String(row["UID"] || row["TERMINAL-ID"] || row["TID"] || row["Machine ID"]).split(".")[0];
                if (!row["Renewal End Date"] && !row["End Date"] && !row["Arv Renewal End Date"]) {
                    console.warn(`No valid end date found for machine ID ${machineId}. Skipping insertion.`);
                    continue;
                }
                
                const actualEndDate = isNaN(Date.parse(row["Renewal End Date"])) ? new Date(row["End Date"] || row["Arv Renewal End Date"]).toISOString() : new Date(row["Renewal End Date"]).toISOString();

                const isMachineExists = db.prepare(`SELECT id FROM machines WHERE machine_id = ?`).get(machineId);

                if (isMachineExists) {
                    console.warn(`Machine with ID ${machineId} already exists. Skipping insertion.`);
                    continue;
                }

                const machineData = {
                    machine_id: machineId,
                    machine_type_id: machineType.id,
                    customer_id: customer.lastInsertRowid || customer.id,
                    subscription_fees: row["Renewal Fee (RM)"] || 0,
                    registered_date: (new Date(row["Register Date"])).toISOString(),
                    end_date: (new Date(actualEndDate)).toISOString(),
                    status: new Date(actualEndDate) > new Date() ? "active" : "inactive",
                    renewal_count: 0,
                    last_renewal_date: null,
                    data: JSON.stringify(filteredFieldsData)
                }

                const machine = seedMachines(machineData);
            }
        }).immediate();
    } catch (e) {
        console.error('Error seeding data:', e);
    }
}

require("./initialize-machine-types");

seedData();