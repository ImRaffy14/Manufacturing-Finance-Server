const processAnomalies = require('../Model/processAnomaliesModel')

const aggregateAnomalies = async () => {
    const getTotalOnInvestigate = await processAnomalies.aggregate([
        {
            $match: { status: 'On investigation'}
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])

    const getTotalResolved = await processAnomalies.aggregate([
        {
            $match: { status: 'Resolved'}
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])

    const totalOnInvestigate = getTotalOnInvestigate.length > 0 ? getTotalOnInvestigate[0].count : 0
    const totalResolved = getTotalResolved.length > 0 ? getTotalResolved[0].count : 0

    return {
        totalOnInvestigate,
        totalResolved
    }
}   

module.exports = {
    aggregateAnomalies,
}