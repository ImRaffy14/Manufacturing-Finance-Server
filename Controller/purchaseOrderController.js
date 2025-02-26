const purchaseOrderRecords = require('../Model/invoiceRecordsModel')
const { getPendingSalesData, getNonPendingRecords, getToAuditRecords } = require("../Model/invoiceAggregation")

// UPDATE STATUS OF PAYMENT
const updateStatus = async (req, res) => {
    const { Status, purchaseOrderId } = req.body

    try{
        if (!Status || !purchaseOrderId) {
            return res.status(400).send("Status and purchaseOrderId are required");
          }
        
        const isProcessed = await purchaseOrderRecords.findOne({_id: purchaseOrderId})
        if(isProcessed.Status === "To review" || isProcessed.Status === "Closed" ){
            return res.status(400).send("This Purchase Order is already processed")
        }
        const updateStatus = await purchaseOrderRecords.findOneAndUpdate({ _id: purchaseOrderId}, {Status: Status}, { new: true } )
        if(!updateStatus){
            return res.status(404).send("Purchase order not found");
        }
        res.status(200).json({ msg: 'The updated purchase order is now on process'})

        //RESPONSE PENDING INVOICE
        const resultPending = await getPendingSalesData()
        req.io.emit("receive_pending_invoice", resultPending)

        //RESPONSE NON PENDING INVOICE
        const resultNonPending = await getNonPendingRecords()
        req.io.emit("receive_non_pending_invoice", resultNonPending)

        //RESPONSE TO REVIEW
        const toReviewRecords = await getToAuditRecords()
        req.io.emit('receive_paid_records', toReviewRecords)
    }
    catch(err){
        console.error(`Update purchase order error: ${err.message}`)
        res.status(500).send('Server Error')
    }
}   

module.exports = {
    updateStatus
}