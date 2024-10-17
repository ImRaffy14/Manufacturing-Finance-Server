const accounts = require('../Model/accountsModel')
const outflowsTransaction = require('../Model/outflowsTransactionModel')
const budgetRequestData = require("../Model/budgetRequestModel")
const { pendingRequests, processedRequestBudget } = require("../Model/budgetRequestAggregation")
const { allocateBudget } = require("../Model/totalCashAggregation")
const bcrypt = require('bcryptjs')

module.exports = (socket, io) =>{

    //GET BUDGET ALLOCATION
    const budgetAllocation = async (data) => {
        const result = await allocateBudget()
        socket.emit("receive_budget_allocation", result)
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

    //GET TIME
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();
        return `${date} ${time}`;
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
    }

    //RESPONSE TO FINANCE CLIENT
    socket.emit("receive_budget_request", {msg: `Budget request from ${budgetReqData.department} is ${budgetReqData.status === "Declined" ? 'declined.' : 'approved.'}`})
    const requestDataPending = await pendingRequests()
    const requestDataprocessed = await processedRequestBudget()
    io.emit('receive_budget_request_pending', requestDataPending)
    io.emit('receive_budget_request_processed', requestDataprocessed)
    io.emit('receive_budget_request_length', requestDataPending.onProcessRequestBudgetCount)
    io.emit('receive_payable_length', requestDataPending.pendingBudgetRequestsCount.totalCount)

    }

    socket.on("get_budget_allocation", budgetAllocation)
    socket.on("budget_request_data", approvedBudgetRequest)
}