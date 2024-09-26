const invoiceRecord = require("../Model/invoiceRecordsModel")

const getPendingSalesData = async () => {
const pendingSalesData = await invoiceRecord.aggregate([
    {
    $match: { Status: 'Pending' } 
    },
    {
    $group: {
        _id: null,
        totalAmount: { $sum: "$totalAmount" },
        totalCount: { $sum: 1 }
    }
    }
]);

const pendingSalesCount = pendingSalesData.length > 0
? { totalAmount: pendingSalesData[0].totalAmount, totalCount: pendingSalesData[0].totalCount }
: { totalAmount: 0, totalCount: 0 };

const pendingSales = await invoiceRecord.find({ Status: 'Pending' });

return { pendingSales, pendingSalesCount };
};

module.exports = { getPendingSalesData };