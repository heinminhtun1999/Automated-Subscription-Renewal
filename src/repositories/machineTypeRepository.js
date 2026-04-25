const db = require("../db/db");

function getAllType() {
    return db.prepare(`SELECT * FROM machine_types`).all();
}

function addMachineType(name) {
    const stmt = db.prepare(
        `
        INSERT INTO machine_types (name) VALUES (?)
        `
    )
    return stmt.run(name);
}

function updateMachineTypeName(id, name) {
    const stmt = db.prepare(
        `
        UPDATE machine_types SET name = ? WHERE id = ?
        `
    );
    return stmt.run(name, id);
}

function deleteMachineType(id) {
    const stmt = db.prepare(
        `
        DELETE FROM machine_types WHERE id = ?`
    );
    return stmt.run(id);
}

function getAllMachineTypesWithFields() {
    const stmt = db.prepare(
        `
        SELECT mt.name, mt.id, mf.name AS field_name, mf.id AS field_id
        FROM machine_types AS mt
        LEFT JOIN machine_type_fields AS mf ON mt.id = mf.machine_type_id
        GROUP BY mt.id, mf.id
        ORDER BY mt.created_at, mf.created_at
        `
    )

    const data = stmt.all();

    const formattedData = data.reduce((acc, item) => {
        const existingType = acc.find(type => type.type_id === item.id);
        if (existingType) {
            existingType.fields.push({
                field_id: item.field_id,
                name: item.field_name
            });
        } else {
            acc.push({
                type_id: item.id,
                name: item.name,
                fields: [
                    {
                        field_id: item.field_id,
                        name: item.field_name
                    }
                ]
            })
        }
        return acc;
    }, []);

    return formattedData;
}

function getMachineTypeByName(name) {
    const stmt = db.prepare(`
        SELECT id, name FROM machine_types WHERE name = ?
     `);
    return stmt.get(name);
}

function getMachineTypeById(id) {
    const stmt = db.prepare(`
        SELECT id, name FROM machine_types WHERE id = ?
     `);
    return stmt.get(id);
}

function getMachineTypeByIdWithFields(id) {
    const stmt = db.prepare(
        `
        SELECT mt.name, mt.id, mf.name AS field_name, mf.id AS field_id
        FROM machine_types AS mt
        LEFT JOIN machine_type_fields AS mf ON mt.id = mf.machine_type_id
        WHERE mt.id = ?
        GROUP BY mt.id, mf.id
        ORDER BY mt.created_at, mf.created_at
        `
    )

    const data = stmt.all(id);

    if (!data.length) return {};

    const formattedData = data.reduce((acc, item) => {
        acc.fields.push({
            field_id: item.field_id,
            name: item.field_name
        });
        return acc
    }, { type_id: data[0].id, name: data[0].name, fields: [] });

    return formattedData;
}

module.exports = {
    getAllType,
    addMachineType,
    getAllMachineTypesWithFields,
    getMachineTypeByIdWithFields,
    addMachineType,
    updateMachineTypeName,
    getMachineTypeByName,
    deleteMachineType,
    getMachineTypeById
}