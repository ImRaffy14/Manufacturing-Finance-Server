const outflowsTransaction = require('../Model/outflowsTransactionModel');

const rawMaterials = async () => {
    const outflowRawMaterials = await outflowsTransaction.aggregate([

        {
            $match: {
                department: 'Logistic1',
                category: 'Operational Expenses'
            }
        },

        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
            }
        }
    ]);

    return outflowRawMaterials.length > 0 ? outflowRawMaterials[0].totalAmount : 0;
};

const laborCost = async () => {
    const outflowLaborCost = await outflowsTransaction.aggregate([
        {
            $match: {
                department: 'Logistic1',
                category: 'Capital Expenditures'
            }
        },

        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ])

    return outflowLaborCost.length > 0 ? outflowLaborCost[0].totalAmount : 0;
}

const salariesAndWages = async () => {
    const outflowSalariesAndWages = await outflowsTransaction.aggregate([
        {
            $match: {
                department:'HR3',
                category: 'Operational Expenses'
            }
        },

        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ])

    return outflowSalariesAndWages.length > 0 ? outflowSalariesAndWages[0].totalAmount : 0;
}

const utilities = async () => {
    const outflowUtilities = await outflowsTransaction.aggregate([
        {
            $match: {
                department: 'Finance',
                category: 'Operational Expenses'
            }
        },

        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ])

    return outflowUtilities.length > 0 ? outflowUtilities[0].totalAmount : 0;
}

const employeeExpenses = async () => {
    const outflowemployeeExpenses = await outflowsTransaction.aggregate([
        {
            $match:{
                department: 'HR4',
                category: 'Operational Expenses',
            }
        },

        {
            $group:{
                _id: null,
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ])

    return outflowemployeeExpenses.length > 0 ? outflowemployeeExpenses[0].totalAmount : 0;
}

module.exports = {
    rawMaterials,
    laborCost,
    salariesAndWages,
    utilities,
    employeeExpenses
}
