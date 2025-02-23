const budgetRequestData = require('../Model/budgetRequestModel')


// ALL PENDING AND ON PROCESS DATA
const pendingRequests = async () => {

    const pendingBudgetRequestsData = await budgetRequestData.aggregate([
        {
        $match: { status: {$in: ['On process']} } 
        },
        {
        $group: {
            _id: null,
            totalAmount: { $sum: "$totalRequest" },
            totalCount: { $sum: 1 }
        }
        }
    ]);

    const pendingBudgetRequestsCount = pendingBudgetRequestsData.length > 0
    ? { totalAmount: pendingBudgetRequestsData[0].totalAmount, totalCount: pendingBudgetRequestsData[0].totalCount }
    : { totalAmount: 0, totalCount: 0 };

    const pendingRequestBudget = await budgetRequestData.find({
        status: 'Pending'
    }).sort({ createdAt: -1})

    const onProcessRequestBudget = await budgetRequestData.find({
        status: 'On process'
    }).sort({ createdAt: -1})
    
    const onProcessRequestBudgetCount = onProcessRequestBudget.length

    return { pendingBudgetRequestsCount, pendingRequestBudget, onProcessRequestBudget, onProcessRequestBudgetCount}
}

// ALL APPROVED OR DECLINED DATA
const processedRequestBudget = async () => {
    const result = await budgetRequestData.find({
        status: {$in: ['Approved', 'Declined']}
    }).sort({ createdAt: -1})

    return result
}

module.exports = {
    pendingRequests,
    processedRequestBudget
}