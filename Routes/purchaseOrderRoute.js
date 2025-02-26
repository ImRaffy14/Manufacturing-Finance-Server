const { updateStatus } = require("../Controller/purchaseOrderController")
const express = require("express")

const router = express.Router()

router.post('/update', updateStatus)

module.exports = router