const express = require('express')
const { getAccounts, createAccount, updateAccount, deleteAccount} = require("../Controller/accountController")
const upload = require('../middleware/multer')

const router = express.Router()


//GET ALL ACCOUNTS
router.get('/', getAccounts)

//ADD ACCOUNT / CREATE ACCOUNTS
router.post('/CreateAccount', upload.single("image"), createAccount)

//UPDATE ACCOUNT
router.post('/UpdateAccount', updateAccount)

//DELETE ACCOUNT
router.post('/DeleteAccount', deleteAccount)

module.exports = router