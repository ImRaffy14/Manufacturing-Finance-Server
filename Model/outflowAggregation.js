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

module.exports = {
    rawMaterials,
}
