const { totalCompanyCash } = require("../Model/totalCashAggregation")
const { accountsBalance, rawMaterials, laborCost, salariesAndWages, utilities, employeeExpenses } = require("../Model/chartOfAccountsAggregation")
const { aggregateTransactionsCurrentMonth } = require("../Model/collectionAnalyticsAggregation")

module.exports = (socket, io) => {

    // HANDLE GET CHAT OF ACCOUNTS
    const getChartOfAccounts = async (data) => {
        const totalCash = await totalCompanyCash()
        const accountsPayablesAndReceivables = await accountsBalance()
        const resultInflow = await aggregateTransactionsCurrentMonth()
        const totalSales = await resultInflow.totalInflows
        const rawMaterialExpenses = await rawMaterials()
        const laborCostExpenses = await laborCost()
        const salariesAndWagesExpenses = await salariesAndWages()
        const utilitiesExpenses = await utilities()
        const companyActivitiesExpenses = await employeeExpenses()

        const accountBalance = {
            totalCash: totalCash,
            payableRawMaterials: accountsPayablesAndReceivables.rawMaterialBalance,
            payableMachinery: accountsPayablesAndReceivables.machineryBalance,
            payableSalaryAndWages: accountsPayablesAndReceivables.salaryAndWagesBalance,
            payableUtilities: accountsPayablesAndReceivables.utilitiesBalance,
            payableCompanyActivites: accountsPayablesAndReceivables.companyActivitiesBalance,
            receivablePurchaseOrder: accountsPayablesAndReceivables.purchaseOrderBalance,
            totalSales,
            rawMaterialExpenses,
            laborCostExpenses,
            salariesAndWagesExpenses,
            utilitiesExpenses,
            companyActivitiesExpenses
        }

        socket.emit('receive_chart_of_account', accountBalance)
    }

    socket.on('get_chart_of_account', getChartOfAccounts)
}