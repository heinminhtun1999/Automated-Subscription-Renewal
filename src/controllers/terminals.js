const { getSheetData } = require("../utils/services/sheets");
const { groupByCompanyName, filterByDate } = require("../utils/utils");

const terminalsController = async (req, res) => {
    console.log('Received query parameters:', req.query);

    // const sheetData = await getSheetData();
    // const groupedData = groupByCompanyName(sheetData);
    // const filteredData = filterByDate(groupedData, req.query.startDate, req.query.endDate);
    // return res.send(filteredData);
    return res.render('terminals', { data: [""]});   
}

module.exports = terminalsController;