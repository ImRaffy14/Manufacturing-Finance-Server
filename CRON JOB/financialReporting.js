const cron = require('node-cron');
const financialReportModel = require('../Model/financialReportsModel')
const { totalCompanyCash } = require('../Model/totalCashAggregation')
const { getPendingSalesData } = require('../Model/invoiceAggregation')
const { pendingRequests } = require('../Model/budgetRequestAggregation')
const { aggregateTransactionsCurrentMonth } = require('../Model/collectionAnalyticsAggregation')
const { rawMaterials, laborCost, salariesAndWages, utilities, employeeExpenses } = require('../Model/outflowAggregation')


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

            //BALANCED SHEET
            const totalCompanyCashAmout = await totalCompanyCash()
            const pendingSalesData = await getPendingSalesData()
            const totalAssets = totalCompanyCashAmout + pendingSalesData.pendingSalesCount.totalAmount;
            const accountsPayable  = await pendingRequests()
            const totalEquity = totalAssets - accountsPayable.pendingBudgetRequestsCount.totalAmount;
            const totalLiabilitiesAndEquity = totalAssets + totalEquity;
            
            //INCOME STATEMENT
            const salesRevenue = await aggregateTransactionsCurrentMonth()
            const COGSrawMaterials = await rawMaterials()
            const COGSlaborCost = await laborCost()
            const COGSsalariesAndWages = await salariesAndWages()
            const COGSutilities = await utilities()
            const COGSemployeeExpenses = await employeeExpenses()
            const totalCOGS = COGSrawMaterials + COGSlaborCost;
            const totalOperatingExpenses = COGSsalariesAndWages + COGSutilities + COGSemployeeExpenses;
            const grossProfit = salesRevenue.totalInflows - totalCOGS;
            const netIncome = grossProfit - totalOperatingExpenses;

            //CASH FLOW
            const totalOutflowsO = salesRevenue.totalInflows + COGSrawMaterials;
            const totalOutflowsI = COGSlaborCost + COGSutilities;
            const beginningBalance = totalOutflowsO - totalOutflowsI;
            const netCashFlow = beginningBalance + salesRevenue.totalInflows;
            const endingBalance = netCashFlow + beginningBalance;

            
            //SAVING NEW FINANCIAL
            const newFinancialReport = new financialReportModel({
                date: getCurrentDateTime(),

                //BALANCEDSHEET
                cash: totalCompanyCashAmout,
                inventory: 0,
                accountsReceivable: pendingSalesData.pendingSalesCount.totalAmount,
                totalAssets: totalAssets,
                accountsPayable: accountsPayable.pendingBudgetRequestsCount.totalAmount,
                totalLiabilities: accountsPayable.pendingBudgetRequestsCount.totalAmount,   
                ownersEquity: totalEquity,
                totalEquity: totalEquity,
                totalLiabilitiesAndEquity: totalLiabilitiesAndEquity,

                //INCOME STATEMENT
                salesRevenue: salesRevenue.totalInflows,
                totalRevenue: salesRevenue.totalInflows,
                rawMaterials: COGSrawMaterials,
                laborCosts: COGSlaborCost,
                totalCogs: totalCOGS,
                salariesWages: COGSsalariesAndWages,
                utilities: COGSutilities,
                employeeExpenses: COGSemployeeExpenses,
                totalOperatingExpenses: totalOperatingExpenses,
                grossProfit: grossProfit,
                operatingIncome: totalOperatingExpenses,
                netIncome: netIncome,
                
                //CASH FLOW
                customerPayments: salesRevenue.totalInflows,
                saleOfOldEquipment: 0,
                totalInflows: salesRevenue.totalInflows,
                paymentToSupplier: COGSrawMaterials,
                salariesAndWages: COGSsalariesAndWages,
                totalOutflowsO: totalOutflowsO,
                purchaseOfNewEquipments: COGSlaborCost,
                utilities: COGSutilities,
                totalOutflowsI: totalOutflowsI,
                netCashFlow: netCashFlow,
                beginningBalance: beginningBalance,
                endingBalance: endingBalance
            })
            
            const savedFinancialReport = await newFinancialReport.save()
            if(savedFinancialReport){
                const result = await financialReportModel.find({}).sort({ createdAt: -1 })
                io.emit('receive_financial_report', result)
            }
        }
        catch(err){
            console.error('Error during analytics aggregation:', err);
        }
        }
    });
}