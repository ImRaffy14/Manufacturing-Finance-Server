const accounts = require('../Model/accountsModel')
const outflowsTransaction = require('../Model/outflowsTransactionModel')
const budgetRequestData = require("../Model/budgetRequestModel")
const { pendingRequests, processedRequestBudget } = require("../Model/budgetRequestAggregation")
const { allocateBudget } = require("../Model/totalCashAggregation")
const { totalCompanyCash } = require('../Model/totalCashAggregation')
const { aggregateTransactionsCurrentMonth } = require('../Model/collectionAnalyticsAggregation')
const bcrypt = require('bcryptjs')

module.exports = (socket, io) =>{

    //GET TIME
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('en-US'); 
        const time = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    
        return `${date} ${time}`;
    }

    //GET BUDGET ALLOCATION
    const budgetAllocation = async (data) => {
        const result = await allocateBudget()
        socket.emit("receive_budget_allocation", result)
    }

    //GET BUDGET REPORTS
    const getBudgetReports = async (data) =>{
        const result = await outflowsTransaction.find({}).sort({ createdAt: -1 })
        socket.emit('receive_budget_reports', result)
    }


    //FOR APPROVING BUDGET REQUEST
    const approvedBudgetRequest = async (data) => {
    
    //USER AUTH
    const userId = data.authenticate.userId
    const userName = data.authenticate.userName
    const password = data.authenticate.password
    const _id = data.rowData._id

    const budgetReqData = {
        requestId: data.rowData.requestId,
        department: data.rowData.department,
        typeOfRequest: data.rowData.typeOfRequest, 
        category: data.rowData.category,
        reason: data.rowData.reason,
        totalRequest: data.rowData.totalRequest,
        documents: data.rowData.documents,
        status: data.rowData.status,
        comment: data.rowData.comment
    }


    const user = await accounts.findOne({ userName })
    if(!user){
        return socket.emit('receive_budget_authUser_invalid', {msg: 'Invalid Credentials'})
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
       return socket.emit('receive_budget_authUser_invalid', {msg: 'Invalid Credentials'})
    }


    //CHECK IF BUDGET IS AVAILABLE
    if(budgetReqData.status === "Approved"){
        const availableBudget = await allocateBudget()
        if(budgetReqData.category === "Operational Expenses"){
            if(availableBudget.operatingExpenses < budgetReqData.totalRequest){
                return socket.emit("budget_notfound", {msg: "No available budget for this budget request."})
            }
        }
        else if (budgetReqData.category === "Capital Expenditures"){
            if(availableBudget.capitalExpenditures < budgetReqData.totalRequest){
                return socket.emit("budget_notfound", {msg: "No available budget for this budget request."})
            }
        }
        else if (budgetReqData.category === "Emergency Reserves"){
            if(availableBudget.emergencyReserve < budgetReqData.totalRequest){
                return socket.emit("budget_notfound", {msg: "No available budget for emergency reserve request."})
            }
        }
        else{
            return socket.emit("budget_notfound", {msg: "Invalid Category."})
        }
    }
    
    //CHECKS IF IT ALREADY RECORDED ON OUTFLOWS DATA
    const payableId = _id
    const isMatched = await outflowsTransaction.findOne({ payableId })
    if(isMatched){
        return socket.emit("budget_notfound", {msg: "Budget Request is already approved."})
    }

    //UPDATE THE BUDGET REQUEST MODEL
    const updatedRequest = await budgetRequestData.findByIdAndUpdate(
        _id, // Find document by _id
        budgetReqData,
        { new: true } 
    )

    if(!updatedRequest){
        return socket.emit("budget_notfound", {msg: "Budget request not found."})
    }

    //SAVING TO OUTFLOWS RECORDS
    if(budgetReqData.status === "Approved"){

        const newOutflow = new outflowsTransaction({
            dateTime: getCurrentDateTime(),
            approver: userName,
            approverId: userId,
            payableId: _id,
            category: budgetReqData.category,
            department: budgetReqData.department,
            totalAmount: budgetReqData.totalRequest
        })

        const saveOutflow = await newOutflow.save()
        if(!saveOutflow){
            return socket.emit("budget_notfound", {msg: "Error saving budget records."})
        }

        const result = await outflowsTransaction.find({}).sort({ createdAt: -1 })
        io.emit('receive_budget_reports', result)

        const totalCash = await totalCompanyCash()
        io.emit("receive_total_cash", totalCash)
    }

    //RESPONSE TO FINANCE CLIENT
    socket.emit("receive_budget_request", {msg: `Budget request from ${budgetReqData.department} is ${budgetReqData.status === "Declined" ? 'declined.' : 'approved.'}`, status: budgetReqData.status, comment: budgetReqData.comment})
    const requestDataPending = await pendingRequests()
    const requestDataprocessed = await processedRequestBudget()
    const budgetAllocate = await allocateBudget()
    const totalCash = await totalCompanyCash()
    const analytics = await aggregateTransactionsCurrentMonth()
    io.emit('receive_budget_request_pending', requestDataPending)
    io.emit('receive_budget_request_processed', requestDataprocessed)
    io.emit('receive_budget_request_length', requestDataPending.onProcessRequestBudgetCount)
    io.emit('receive_payable_length', requestDataPending.pendingBudgetRequestsCount.totalCount)
    io.emit("receive_budget_allocation", budgetAllocate)
    io.emit("receive_total_cash", totalCash)
    io.emit("receive_collection_analytics", analytics)

    }


    //ADD BUDGET RESERVE
    const addBudgetReserve = async (data) => {

        const userName = data.userName
        const password = data.password

        const user = await accounts.findOne({ userName })
        if(!user){
            return socket.emit('receive_budget_reserve_authUser_invalid', {msg: 'Invalid Credentials'})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
        return socket.emit('receive_budget_reserve_authUser_invalid', {msg: 'Invalid Credentials'})
        }

        const availableBudget = await allocateBudget()

        if(availableBudget.emergencyReserve < data.totalRequest){
            return socket.emit("budget_reserve_no_budget", {msg: "No available budget for emergency reserve request."})
        }
        

        // SAVING BUDGET RESERVE TO OUTFLOW TRANSACTION
        const newOutflow = new outflowsTransaction({
            dateTime: getCurrentDateTime(),
            approver: userName,
            approverId: user._id,
            payableId: "N/A",
            category: data.category,
            department: data.department,
            totalAmount: data.totalRequest
        })

        const savedOutflow = await newOutflow.save()

        socket.emit("saved_budget_reserved", {msg: "Budget reserved claim successful", amount: savedOutflow?.totalAmount})

        const result = await outflowsTransaction.find({}).sort({ createdAt: -1 })
        io.emit('receive_budget_reports', result)

        const totalCash = await totalCompanyCash()
        io.emit("receive_total_cash", totalCash)

        const budgetAllocate = await allocateBudget()
        const analytics = await aggregateTransactionsCurrentMonth()
        io.emit("receive_budget_allocation", budgetAllocate)
        io.emit("receive_total_cash", totalCash)
        io.emit("receive_collection_analytics", analytics)
        

    }

    socket.on("get_budget_reports", getBudgetReports)
    socket.on("get_budget_allocation", budgetAllocation)
    socket.on("budget_request_data", approvedBudgetRequest)
    socket.on("add_budget_reserve", addBudgetReserve)
}