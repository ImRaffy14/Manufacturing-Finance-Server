const cron = require('node-cron');
const { aggregateTransactionsCurrentMonth, transactionRecordsCurrentMonth} = require('../Model/collectionAnalyticsAggregation')
const monthlyCollection = require('../Model/monthlyCollectionModel')

module.exports = (io) => {
    // Schedule the job to run at midnight on the last day of every month
    cron.schedule('59 23 28-31 * *', async () => {
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        //GET DATE
        function getCurrentDateTime() {
            const now = new Date();
            const date = now.toLocaleDateString();
            return `${date}`;
        }
        
        //STORE RECORDS EVERY AND OF THE MONTH
        if (now.getDate() === lastDayOfMonth) {
        try{
            const analytics = await aggregateTransactionsCurrentMonth()
            const records = await transactionRecordsCurrentMonth()

            const newMonthlyRecords = new monthlyCollection({
                date: getCurrentDateTime(),
                totalInflows: analytics.totalInflows,
                totalOutflows: analytics.totalOutflows,
                inflowDifference: analytics.inflowDifference,
                inflowPercentageChange: analytics.inflowPercentageChange,
                inflowDifferenceArrow: analytics.inflowDifferenceArrow,
                inflowPercentageChangeArrow: analytics.inflowPercentageChangeArrow,
                outflowDifferenceArrow: analytics.outflowDifferenceArrow,
                outflowPercentageChangeArrow: analytics.outflowPercentageChangeArrow,
                outflowDifference: analytics.outflowDifference,
                outflowPercentageChange: analytics.outflowPercentageChange,
                netIncome: analytics.netIncome,
                inflows: analytics.inflows,
                outflows: analytics.outflows,
                inflowRecords: records.inflowsRecords,
                outflowRecords: records.outflowsRecords
            })

            const savedMonthlyRecords = await newMonthlyRecords.save()
            if(savedMonthlyRecords){
                const result = await monthlyCollection.find({}).sort({ createdAt: -1})
                io.emit("receive_collection_records_notif", result)
            }

        }
        catch(err){
            console.error('Error during analytics aggregation:', err);
        }
        }
    });
}