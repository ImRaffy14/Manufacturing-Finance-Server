require('dotenv').config()

const express = require('express')
const { addBudgetRequest, getPendingBudgetRequest, getProcessedBudgetRequest, updateBudgetRequests, addBudgetRequestFinance } = require('../Controller/budgetRequestController')
const upload = require('../middleware/multerDocs')
const jwt = require('jsonwebtoken')

//ROUTER
const router = express.Router()

// VERIFY TOKEN FROM API GATEWAY
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.SERVICE_JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.decoded = decoded;
    next();
  });
};


//GET ALL BUDGET REQUEST DATA
router.get('/', getPendingBudgetRequest)
router.get('/processed', getProcessedBudgetRequest)

//POST BUDGET REQUEST
router.post('/RequestBudget', verifyToken, addBudgetRequest)

//POST BUDGET REQUEST FROM FINANCE CLIENT
router.post('/AddBudgetRequest', upload.single("documents"), addBudgetRequestFinance)

//UPDATE BUDGET REQUEST
router.post('/UpdateRequest',updateBudgetRequests)

module.exports = router