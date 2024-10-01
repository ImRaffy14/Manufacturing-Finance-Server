require('dotenv').config()

const budgetRequestData = require("../Model/budgetRequestModel")
const { encryptData } = require("../middleware/encryption")

//GET ALL BUDGET REQUEST
const getBudgetRequest = async (req, res) => {
    const requestData = await budgetRequestData.find({}).sort({ createdAt: -1})

    if(requestData){
    const result = encryptData(requestData, process.env.ENCRYPT_DATA)
    res.status(200).json(result)
    }
}

// POST BUDGET REQUEST FROM DIFFERENT SUBSYSTEM
const addBudgetRequest = async (req, res) => {
    const { status, totalBudget, category, reason, documents } = req.body

    try{
        const newRequest = new budgetRequestData ({ typeOfRequest: 'Budget', category, reason: reason, totalRequest: totalBudget, documents, status, comment: '' })
        const saveRequest = await newRequest.save()

        if(saveRequest){
            res.status(200).json({msg: 'tanginamo ba?'})
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