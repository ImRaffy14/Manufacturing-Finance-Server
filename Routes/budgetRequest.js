const express = require('express')
const { addBudgetRequest, getPendingBudgetRequest, getProcessedBudgetRequest } = require('../Controller/budgetRequestController')

//ROUTER
const router = express.Router()

//GET ALL BUDGET REQUEST DATA
router.get('/', getPendingBudgetRequest)
router.get('/processed', getProcessedBudgetRequest)

//POST BUDGET REQUEST
router.post('/RequestBudget', addBudgetRequest)

module.exports = router