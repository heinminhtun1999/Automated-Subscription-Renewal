const path = require("path");
const Database = require("better-sqlite3");
const { faker } = require("@faker-js/faker");

const { DEFAULT_MACHINE_TYPE_MAPPING } = require("../src/utils/constants");

const dbPath = path.join(__dirname, "..", "src", "db", "database.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

function parseCount(args, key, defaultCount, positionalIndex) {
    const named = args.find((arg) => arg.startsWith(`${key}=`));
    if (named) {
        const value = Number(named.split("=")[1]);
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultCount;
    }

    const positional = args.filter((arg) => /^\d+$/.test(arg));
    if (positional[positionalIndex]) {
        const value = Number(positional[positionalIndex]);
        return Number.isFinite(value) && value > 0 ? value : defaultCount;
    }

    return defaultCount;
}

function toShortName(companyName) {
    const initials = companyName
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("");
    return initials.slice(0, 8).toUpperCase();
}

function seedCustomers(count) {
    const insertCustomer = db.prepare(`
        INSERT INTO customers (
            company_name,
            company_short_name,
            email,
            contact_number,
            pic_name,
            bank_name,
            bank_account_number,
            beneficiary_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const rows = Array.from({ length: count }, () => {
        const companyName = faker.company.name();
        return [
            companyName,
            toShortName(companyName),
            faker.internet.email({ provider: "example.com" }),
            faker.phone.number("01########"),
            faker.person.fullName(),
            `${faker.company.name()} Bank`,
            faker.finance.accountNumber(10),
            faker.person.fullName()
        ];
    });

    const insertMany = db.transaction(() => {
        rows.forEach((row) => insertCustomer.run(row));
    });

    insertMany();
    return rows.length;
}

function ensureMachineTypes() {
    const selectTypeByName = db.prepare("SELECT id FROM machine_types WHERE name = ?");
    const insertType = db.prepare("INSERT INTO machine_types (name) VALUES (?)");
    const selectFieldsByType = db.prepare("SELECT name FROM machine_type_fields WHERE machine_type_id = ?");
    const insertField = db.prepare(`
        INSERT INTO machine_type_fields (machine_type_id, name)
        VALUES (?, ?)
    `);

    const upsert = db.transaction(() => {
        DEFAULT_MACHINE_TYPE_MAPPING.forEach((type) => {
            const { name, fields } = type;
            const existingType = selectTypeByName.get(name);
            let machineTypeId = existingType ? existingType.id : null;

            if (!machineTypeId) {
                const result = insertType.run(name);
                machineTypeId = result.lastInsertRowid;
            }

            const existingFields = new Set(
                selectFieldsByType.all(machineTypeId).map((row) => row.name)
            );

            fields.forEach((field_name) => {
                if (!existingFields.has(field_name)) {
                    insertField.run(
                        machineTypeId,
                        field_name
                    );
                }
            });
        });
    });

    upsert();
}

function loadMachineTypes() {
    const types = db.prepare("SELECT id, name FROM machine_types ORDER BY id").all();
    const fieldsByTypeId = new Map();
    const fields = db.prepare("SELECT id, machine_type_id, name FROM machine_type_fields").all();
    fields.forEach((field) => {
        if (!fieldsByTypeId.has(field.machine_type_id)) {
            fieldsByTypeId.set(field.machine_type_id, []);
        }
        fieldsByTypeId.get(field.machine_type_id).push(field);
    });
    return { types, fieldsByTypeId };
}

function loadCustomers() {
    return db.prepare("SELECT id FROM customers ORDER BY id").all();
}

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function buildMachineData(fields) {
    const data = {};
    fields.forEach((field) => {
        let value;
        if (/location/i.test(field.name)) {
            value = faker.location.city();
        } else if (/serial|s\/?n/i.test(field.name)) {
            value = faker.string.alphanumeric({ length: 10 }).toUpperCase();
        } else if (/count|qty|quantity|number|amount/i.test(field.name)) {
            value = faker.number.int({ min: 1, max: 5000 });
        } else if (/active|enabled|valid|available|paid|boolean|flag/i.test(field.name)) {
            value = faker.datatype.boolean();
        } else if (/date|end\s*date|start\s*date|expiry|expire/i.test(field.name)) {
            value = faker.date.recent({ days: 365 }).toISOString().split("T")[0];
        } else {
            value = faker.word.words({ count: { min: 1, max: 3 } });
        }

        data[field.id] = value;
    });
    return data;
}

function buildDates() {
    const registered = faker.date.recent({ days: 365 });
    const endDate = new Date(registered);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const renewalCount = faker.number.int({ min: 0, max: 3 });
    let lastRenewalDate = null;
    if (renewalCount > 0) {
        lastRenewalDate = faker.date.between({ from: registered, to: endDate });
    }

    return {
        registeredDate: registered.toISOString(),
        endDate: endDate.toISOString(),
        renewalCount,
        lastRenewalDate: lastRenewalDate ? lastRenewalDate.toISOString() : null
    };
}

function seedMachines(count) {
    const customers = loadCustomers();
    if (!customers.length) {
        console.error("No customers found. Provide a customers count to seed them first.");
        return 0;
    }

    const { types, fieldsByTypeId } = loadMachineTypes();
    if (!types.length) {
        console.error("No machine types found. Check DEFAULT_MACHINE_TYPE_MAPPING.");
        return 0;
    }

    const existingMachineIds = new Set(
        db.prepare("SELECT machine_id FROM machines").all().map((row) => row.machine_id)
    );

    const insertMachine = db.prepare(`
        INSERT INTO machines (
            machine_type_id,
            company_id,
            machine_id,
            subscription_fees,
            registered_date,
            end_date,
            status,
            renewal_count,
            last_renewal_date,
            data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const inserted = db.transaction(() => {
        let created = 0;
        while (created < count) {
            const type = pickRandom(types);
            const customer = pickRandom(customers);
            let machineId = null;
            let attempts = 0;

            while (!machineId && attempts < 10) {
                const candidate = `M-${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`;
                if (!existingMachineIds.has(candidate)) {
                    machineId = candidate;
                    existingMachineIds.add(candidate);
                }
                attempts += 1;
            }

            if (!machineId) {
                break;
            }

            const fields = fieldsByTypeId.get(type.id) || [];
            const data = buildMachineData(fields);
            const dates = buildDates();

            insertMachine.run(
                type.id,
                customer.id,
                machineId,
                faker.number.float({ min: 100, max: 2000, precision: 0.01 }),
                dates.registeredDate,
                dates.endDate,
                dates.endDate && new Date(dates.endDate) > new Date() ? "active" : "inactive",
                dates.renewalCount,
                dates.lastRenewalDate,
                JSON.stringify(data)
            );

            created += 1;
        }
        return created;
    });

    return inserted();
}

try {
    const args = process.argv.slice(2);
    const customersCount = parseCount(args, "customers", 20, 0);
    const machinesCount = parseCount(args, "machines", 40, 1);

    const seededCustomers = seedCustomers(customersCount);
    ensureMachineTypes();
    const seededMachines = seedMachines(machinesCount);

    console.log(
        `Seeded ${seededCustomers} customers and ${seededMachines} machines into ${dbPath}`
    );
} catch (error) {
    console.error("Failed to seed data:", error);
} finally {
    db.close();
}
