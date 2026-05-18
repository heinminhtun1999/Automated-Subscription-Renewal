const path = require("path");
const Database = require("better-sqlite3");
const dbPath = path.join(__dirname, "..", "src", "db", "database.db");
const db = new Database(dbPath);

const { DEFAULT_MACHINE_TYPE_MAPPING } = require('../src/utils/constants');

function intializeMachineTypes() {
    let error = null;
    try {
        const existingTypes = db.prepare('SELECT name FROM machine_types').all().map(row => row.name);

        for (const type of DEFAULT_MACHINE_TYPE_MAPPING) {
            console.log(`Inserting machine type: ${type.name}, ${existingTypes}`);
            if (!existingTypes.includes(type.name)) {
                const { name, fields } = type;
                db.transaction(() => {

                    // Insert machine type and get its ID
                    const machineTypeStmt = db.prepare(`
                            INSERT INTO machine_types (name) VALUES (?)`
                    );
                    const result = machineTypeStmt.run(name);
                    const machineTypeId = result.lastInsertRowid;

                    // Insert associated fields
                    fields.forEach(field => {
                        console.log(`Inserting field: ${field} for machine type ID: ${machineTypeId}`);
                        const stmt = db.prepare(`
                            INSERT INTO machine_type_fields (machine_type_id, name)
                            VALUES (?, ?)`
                        );
                        stmt.run(machineTypeId, field);
                    });
                }).immediate();
            }
        }
    } catch (e) {
        console.error('Error initializing machine types:', e);
        error = e;
    } finally {
        if (error) {
            console.error('Initialization completed with errors:', error);
        } else {
            console.log('Initialization completed successfully.');
        }
        db.close();
    }
}

intializeMachineTypes();
