const express = require('express')
const { newOrder } = require('../Controller/orderInformationController')

const router = express.Router()

router.post("/post", newOrder)

module.exports = router