require('dotenv').config()

const budgetRequestData = require("../Model/budgetRequestModel")
const { encryptData } = require("../middleware/encryption")

//GET ALL BUDGET REQUEST
const getBudgetRequest = async (req, res) => {
    const requestData = await budgetRequestData.find({}).sort({ createdAt: -1})
    const result = encryptData(requestData, process.env.ENCRYPT_KEY)
    res.status(200).json({result})
}

// POST BUDGET REQUEST FROM DIFFERENT SUBSYSTEM
const addBudgetRequest = async (req, res) => {
    const {_id, status, totalBudget, category, reason, documents } = req.body

    try{
        const newRequest = new budgetRequestData ({updateId: _id, typeOfRequest: 'Budget', category, reason: reason, totalRequest: totalBudget, documents, status, comment: '' })
        const saveRequest = await newRequest.save()

        if(saveRequest){
            res.status(200).json({msg: 'Your Request is on pending'})
        }
    }
    catch (err){
        res.status(401).json({err: err.message})
    }
}

module.exports = {
    getBudgetRequest,
    addBudgetRequest
}