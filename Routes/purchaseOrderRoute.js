const { updateStatus } = require("../Controller/purchaseOrderController")
const express = require("express")
const verifyToken = require('../middleware/verifyGatewayToken')

const router = express.Router()

router.post('/update', verifyToken, updateStatus)

module.exports = router