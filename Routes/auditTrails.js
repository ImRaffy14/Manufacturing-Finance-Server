const express = require("express")
const { auditTrailsRecord, createAuditTrails } = require("../Controller/auditTrailsController")

const router = express.Router()

//GET AUDIT TRAILS
router.get('/', auditTrailsRecord)

//POST AUDIT TRAILS
router.post('/CreateTrails', createAuditTrails)

module.exports = router
