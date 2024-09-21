const express = require('express')
const { getAccounts, createAccount } = require("../Controller/accountController")
const upload = require('../middleware/multer')

const router = express.Router()


//GET ALL ACCOUNTS
router.get('/', getAccounts)

//ADD ACCOUNT / CREATE ACCOUNTS
router.post('/CreateAccount', upload.single("image"), createAccount)

module.exports = router