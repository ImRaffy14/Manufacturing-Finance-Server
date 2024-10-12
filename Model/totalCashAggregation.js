const inflowsTransaction = require('../Model/inflowsTransactionModel')
const outflowsTransaction = require('../Model/outflowsTransactionModel')

//TOTAL INFLOW MONEY
const totalInflowsAmount = async () => {
    const inflows = await inflowsTransaction.aggregate([
        {
            $group: {
                _id: null, 
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ]);

    return inflows.length > 0 ? inflows[0].totalAmount : 0;
}

//TOTAL OUTFLOW MONEY
const totalOutflowsAmount = async () => {
    const outflows = await outflowsTransaction.aggregate([
        {
            $group: {
                _id: null, 
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ])

    return outflows.length > 0 ? outflows[0].totalAmount : 0;
}

// Calculate total cash
const totalCash = async () => {
    const inflows = await totalInflowsAmount();
    const outflows = await totalOutflowsAmount();
    return inflows - outflows;
}

module.exports = {
    totalCash
}