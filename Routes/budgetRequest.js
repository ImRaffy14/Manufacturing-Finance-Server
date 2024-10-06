const express = require('express')
const { addBudgetRequest, getPendingBudgetRequest, getProcessedBudgetRequest, updateBudgetRequests } = require('../Controller/budgetRequestController')

//ROUTER
const router = express.Router()

//GET ALL BUDGET REQUEST DATA
router.get('/', getPendingBudgetRequest)
router.get('/processed', getProcessedBudgetRequest)

//POST BUDGET REQUEST
router.post('/RequestBudget', addBudgetRequest)

//UPDATE BUDGET REQUEST
router.post('/UpdateRequest',updateBudgetRequests)

module.exports = router