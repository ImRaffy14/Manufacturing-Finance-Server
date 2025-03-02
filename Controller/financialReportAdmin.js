const financialReportRecords = require('../Model/financialReportsModel')
const express = require('express')

const router = express.Router()

// GET FINANCIAL REPORT
const getFinancialReport = async (req, res) => {
    const result = await financialReportRecords.find({})
    res.status(200).json(result)
}

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


// Route
router.get('/get-financial-reports', verifyToken, getFinancialReport)

module.exports = router