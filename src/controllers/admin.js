const db = require('../db/db');
const { getAllOrders } = require('../repositories/orderRepository');
const { getMachineByDaysLeft } = require('../repositories/machineRepository');
const { localizedDateTime, formatDate } = require("../utils/utils");

function renderHomePage(req, res) {
    try {
        const getCount = (tableName, whereClause = '') => {
            const query = `SELECT COUNT(*) AS count FROM ${tableName} ${whereClause}`;
            return db.prepare(query).get().count;
        };

        const orders = getAllOrders();
        const processedOrders = orders.reduce((acc, order) => {
            if (acc.has(order.order_id)) {
                acc.get(order.order_id).machines.push(order.machine_id);
                return acc;
            }

            acc.set(order.order_id, {
                id: order.id,
                order_id: order.order_id,
                amount: order.amount,
                payment_status: order.payment_status,
                process_status: order.process_status,
                created_at: order.created_at,
                company_name: order.company_name,
                machines: [order.machine_id]
            });

            return acc;
        }, new Map());

        const recentOrders = Array.from(processedOrders.values()).slice(0, 5).map(order => ({
            ...order,
            created_at_label: localizedDateTime(order.created_at),
            amount_label: `RM ${Number(order.amount).toFixed(2)}`
        }));
        const expiringMachines = getMachineByDaysLeft(30, false).slice(0, 6).map(machine => {
            console.log(machine)
            return {
                ...machine,
                end_date_label: formatDate(machine.end_date),
                days_left_label: Math.ceil(machine.days_left)
            }
        });

        const totalCustomers = getCount('customers');
        const totalMachines = getCount('machines');
        const totalOrders = getCount('orders');
        const pendingOrders = getCount('orders', "WHERE process_status IN ('pending', 'processing')");
        const successfulOrders = getCount('orders', "WHERE payment_status = 'paid' AND process_status = 'completed'");

        return res.render('admin/home/index', {
            data: {
                summary: {
                    totalCustomers,
                    totalMachines,
                    totalOrders,
                    pendingOrders,
                    successfulOrders,
                    expiringSoon: expiringMachines.length
                },
                recentOrders,
                expiringMachines
            },
            error: null,
            activePage: 'home',
            subTitle: 'Home'
        });
    } catch (error) {
        return res.status(500).render('admin/home/index', {
            data: {
                summary: {
                    totalCustomers: 0,
                    totalMachines: 0,
                    totalOrders: 0,
                    pendingOrders: 0,
                    successfulOrders: 0,
                    expiringSoon: 0
                },
                recentOrders: [],
                expiringMachines: []
            },
            error: `Failed to load admin dashboard. Please try again later. ${error.message}`,
            activePage: 'home',
            subTitle: 'Home'
        });
    }
}

module.exports = {
    renderHomePage
}