const express = require('express')
const { addBudgetRequest, getBudgetRequest } = require('../Controller/budgetRequestController')

//ROUTER
const router = express.Router()

//GET ALL BUDGET REQUEST DATA
router.get('/', getBudgetRequest)

//POST BUDGET REQUEST
router.post('/RequestBudget', addBudgetRequest)

module.exports = router