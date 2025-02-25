const budgetRequestRecords = require("./budgetRequestModel")
const purchaseOrderRecords = require("./invoiceRecordsModel")
const outflowsTransaction = require('../Model/outflowsTransactionModel');
const moment = require('moment');

const accountsBalance = async () => {

    // GET RAW MATERIALS BALANCE
    const getPayableRawMaterials = await budgetRequestRecords.aggregate([
        {
            $match: { department: "Logistic1",  typeOfRequest: "Budget", category: "Operational Expenses", status: "On process"}
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalRequest"}
            }
        }
    ])

    const rawMaterialBalance = getPayableRawMaterials.length > 0 ? getPayableRawMaterials[0].totalAmount : 0;


    // GET MACHINERY BALANCE
    const getPayableMachinery = await budgetRequestRecords.aggregate([
        {
            $match: { department: "Logistic1",  typeOfRequest: "Budget", category: "Capital Expenditures", status: "On process"}
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalRequest"}
            }
        }
    ])

    const machineryBalance = getPayableMachinery.length > 0 ? getPayableMachinery[0].totalAmount : 0

    // GET SALARY AND WAGES BALANCE
    const getPayableSalary = await budgetRequestRecords.aggregate([
        {
            $match: { department: "HR3",  typeOfRequest: "Budget", category: "Operational Expenses", status: "On process"}
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalRequest"}
            }
        }
    ])

    const salaryAndWagesBalance = getPayableSalary.length > 0 ? getPayableSalary[0].totalAmount : 0

    // GET UTILITIES BALANCE
    const getPayableUtilities =  await budgetRequestRecords.aggregate([
        {
            $match: { department: "Finance",  typeOfRequest: "Budget", category: "Operational Expenses", status: "On process"}
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalRequest"}
            }
        }
    ])

    const utilitiesBalance = getPayableUtilities.length > 0 ? getPayableUtilities[0].totalAmount : 0
    
    // GET COMPANY ACTIVITIES BALANCE
    const getPayableCompanyActivities = await budgetRequestRecords.aggregate([
        {
            $match: { department: "HR4",  typeOfRequest: "Budget", category: "Operational Expenses", status: "On process"}
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalRequest"}
            }
        }
    ])

    const companyActivitiesBalance = getPayableCompanyActivities.length > 0 ? getPayableCompanyActivities[0].totalAmount : 0


    // GET PURCHASE ORDER BALANCE
    const getReceivablePurchaseOrder =  await purchaseOrderRecords.aggregate([
        {
            $match: { Status: "Pending" }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount"}
            }
        }
    ])

    const purchaseOrderBalance = getReceivablePurchaseOrder.length > 0 ? getReceivablePurchaseOrder[0].totalAmount : 0
    
    
    return {
        rawMaterialBalance,
        machineryBalance,
        salaryAndWagesBalance,
        utilitiesBalance,
        purchaseOrderBalance,
        companyActivitiesBalance
    }
}


// GET EXPENSES OF THE CURRENT MONTH

const getCurrentMonthRange = () => {
    const startOfMonth = moment().startOf('month').format('MM/DD/YYYY 00:00:00');
    const endOfMonth = moment().endOf('month').format('MM/DD/YYYY 23:59:59');
    return { startOfMonth, endOfMonth };
};


const rawMaterials = async () => {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const outflowRawMaterials = await outflowsTransaction.aggregate([
        {
            $addFields: {
                convertedDate: {
                    $dateFromString: {
                        dateString: "$dateTime",
                        format: "%m/%d/%Y %H:%M:%S",
                    },
                },
            },
        },
        {
            $match: {
                department: 'Logistic1',
                category: 'Operational Expenses',
                convertedDate: {
                    $gte: new Date(startOfMonth),
                    $lte: new Date(endOfMonth),
                },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
            },
        },
    ]);

    return outflowRawMaterials.length > 0 ? outflowRawMaterials[0].totalAmount : 0;
};

const laborCost = async () => {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const outflowLaborCost = await outflowsTransaction.aggregate([
        {
            $addFields: {
                convertedDate: {
                    $dateFromString: {
                        dateString: "$dateTime",
                        format: "%m/%d/%Y %H:%M:%S",
                    },
                },
            },
        },
        {
            $match: {
                department: 'Logistic1',
                category: 'Capital Expenditures',
                convertedDate: {
                    $gte: new Date(startOfMonth),
                    $lte: new Date(endOfMonth),
                },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
            },
        },
    ]);

    return outflowLaborCost.length > 0 ? outflowLaborCost[0].totalAmount : 0;
};

const salariesAndWages = async () => {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const outflowSalariesAndWages = await outflowsTransaction.aggregate([
        {
            $addFields: {
                convertedDate: {
                    $dateFromString: {
                        dateString: "$dateTime",
                        format: "%m/%d/%Y %H:%M:%S",
                    },
                },
            },
        },
        {
            $match: {
                department:'HR3',
                category: 'Operational Expenses',
                convertedDate: {
                    $gte: new Date(startOfMonth),
                    $lte: new Date(endOfMonth),
                },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
            },
        },
    ]);

    return outflowSalariesAndWages.length > 0 ? outflowSalariesAndWages[0].totalAmount : 0;
};

const utilities = async () => {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const outflowUtilities = await outflowsTransaction.aggregate([
        {
            $addFields: {
                convertedDate: {
                    $dateFromString: {
                        dateString: "$dateTime",
                        format: "%m/%d/%Y %H:%M:%S",
                    },
                },
            },
        },
        {
            $match: {
                department: 'Finance',
                category: 'Operational Expenses',
                convertedDate: {
                    $gte: new Date(startOfMonth),
                    $lte: new Date(endOfMonth),
                },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
            },
        },
    ]);

    return outflowUtilities.length > 0 ? outflowUtilities[0].totalAmount : 0;
};

const employeeExpenses = async () => {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const outflowEmployeeExpenses = await outflowsTransaction.aggregate([
        {
            $addFields: {
                convertedDate: {
                    $dateFromString: {
                        dateString: "$dateTime",
                        format: "%m/%d/%Y %H:%M:%S",
                    },
                },
            },
        },
        {
            $match: {
                department: 'HR4',
                category: 'Operational Expenses',
                convertedDate: {
                    $gte: new Date(startOfMonth),
                    $lte: new Date(endOfMonth),
                },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
            },
        },
    ]);

    return outflowEmployeeExpenses.length > 0 ? outflowEmployeeExpenses[0].totalAmount : 0;
};

module.exports = {
    accountsBalance,
    rawMaterials,
    laborCost,
    salariesAndWages,
    utilities,
    employeeExpenses
}