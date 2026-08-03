const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const rawData = fs.readFileSync(dataPath);
const machines = JSON.parse(rawData);

const now = new Date();

const validMachines = machines.filter(m => {
    const renewalDate = m['Renewal End Date'] || m['Arv Renewal End Date'];
    return typeof renewalDate === 'number' && renewalDate > 0;
});

const machinesToChangeCount = Math.floor(validMachines.length * 0.4);
const within7DaysCount = Math.floor(machinesToChangeCount * 0.4);
const within45DaysCount = machinesToChangeCount - within7DaysCount;

const shuffledMachines = validMachines.sort(() => 0.5 - Math.random());

const machinesToChange = shuffledMachines.slice(0, machinesToChangeCount);
const machinesFor7Days = machinesToChange.slice(0, within7DaysCount);
const machinesFor45Days = machinesToChange.slice(within7DaysCount);

function getRandomDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * days));
    return date.getTime();
}

function getRandomDateInRange(minDays, maxDays) {
    const days = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.getTime();
}

machinesFor7Days.forEach(machine => {
    const newDate = getRandomDate(7);
    if (machine['Renewal End Date']) {
        machine['Renewal End Date'] = newDate;
    } else if (machine['Arv Renewal End Date']) {
        machine['Arv Renewal End Date'] = newDate;
    }
});

machinesFor45Days.forEach(machine => {
    const newDate = getRandomDateInRange(8, 45);
    if (machine['Renewal End Date']) {
        machine['Renewal End Date'] = newDate;
    } else if (machine['Arv Renewal End Date']) {
        machine['Arv Renewal End Date'] = newDate;
    }
});

fs.writeFileSync(dataPath, JSON.stringify(machines, null, 4));

console.log(`Updated ${machinesToChangeCount} machines.`);
console.log(`${within7DaysCount} machines updated to be within 7 days.`);
console.log(`${within45DaysCount} machines updated to be within 45 days.`);
