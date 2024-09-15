const express = require('express')
const { getAccounts, createAccount } = require("../Controller/accountController")

const router = express.Router()


//GET ALL ACCOUNTS
router.get('/', getAccounts)

//ADD ACCOUNT / CREATE ACCOUNTS
router.post('/CreateAccount', createAccount)

module.exports = router