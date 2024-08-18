const express = require('express')
const { getAll, storeData } = require('../Controller/sampleController')

//Router
const router = express.Router()

router.get('/', getAll)
router.post('/', storeData)

module.exports = router