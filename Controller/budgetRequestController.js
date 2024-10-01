require('dotenv').config()

const budgetRequestData = require("../Model/budgetRequestModel")
const { encryptData } = require("../middleware/encryption")

//GET ALL BUDGET REQUEST
const getBudgetRequest = async (req, res) => {
    const requestData = await budgetRequestData.find({}).sort({ createdAt: -1})
    const result = encryptData(requestData, process.env.ENCRYPT_DATA)

    res.status(200).json(result)
}

// POST BUDGET REQUEST FROM DIFFERENT SUBSYSTEM
const addBudgetRequest = async (req, res) => {
    console.log(req)
}

module.exports = {
    getBudgetRequest,
    addBudgetRequest
}