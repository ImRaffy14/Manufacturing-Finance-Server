const express = require('express')
const { newOrder } = require('../Controller/orderInformationController')
const verifyToken = require('../middleware/verifyGatewayToken')

const router = express.Router()

router.post("/post", verifyToken, newOrder)

module.exports = router