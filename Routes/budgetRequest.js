const express = require('express')
const { addBudgetRequest, getPendingBudgetRequest, getProcessedBudgetRequest, updateBudgetRequests, addBudgetRequestFinance } = require('../Controller/budgetRequestController')
const upload = require('../middleware/multerDocs')

//ROUTER
const router = express.Router()

//GET ALL BUDGET REQUEST DATA
router.get('/', getPendingBudgetRequest)
router.get('/processed', getProcessedBudgetRequest)

//POST BUDGET REQUEST
router.post('/RequestBudget', addBudgetRequest)

//POST BUDGET REQUEST FROM FINANCE CLIENT
router.post('/AddBudgetRequest', upload.single("documents"), addBudgetRequestFinance)

//UPDATE BUDGET REQUEST
router.post('/UpdateRequest',updateBudgetRequests)

module.exports = router