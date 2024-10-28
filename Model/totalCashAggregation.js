const inflowsTransaction = require('../Model/inflowsTransactionModel')
const outflowsTransaction = require('../Model/outflowsTransactionModel')
const depositRecords = require('../Model/depositModel')
const withdrawRecords = require('../Model/withdrawModel')


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

//TOTAL DEPOSITS RECORD
const totalDepositAmount = async () => {
    const depositAmount = await depositRecords.aggregate([
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ]);

    return depositAmount.length > 0 ? depositAmount[0].totalAmount : 0;
}


//TOTAL WITHDRAW RECORD
const totalWithdrawAmount = async () => {
    const withdrawAmount = await withdrawRecords.aggregate([
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ]);

    return withdrawAmount.length > 0 ? withdrawAmount[0].totalAmount : 0;
}




// Calculate total cash
const totalCompanyCash = async () => {
    const inflows = await totalInflowsAmount();
    const outflows = await totalOutflowsAmount();
    const deposit = await totalDepositAmount();
    const withdraw = await totalWithdrawAmount();
    
    const totalInflows = inflows + deposit;
    const totalOutflows = outflows + withdraw;

    return totalInflows - totalOutflows;
}

const allocateBudget = async () =>{
    const totalCash = await totalCompanyCash()

    const operatingExpenses = totalCash * 0.60;
    const capitalExpenditures = totalCash * 0.25;
    const emergencyReserve = totalCash * 0.05;

    return {
        operatingExpenses: operatingExpenses,
        capitalExpenditures: capitalExpenditures,
        emergencyReserve: emergencyReserve,
    };
}

module.exports = {
    totalCompanyCash,
    allocateBudget
}