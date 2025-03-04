const invoiceRecords = require("../Model/invoiceRecordsModel")
const { getPendingSalesData, getNonPendingRecords } = require("../Model/invoiceAggregation")
const { totalLength, purchaseOrderDuplication } = require('../Controller/Anomaly-Detection/rule-based/detectDuplication')
const orderInformationRecords = require('../Model/orderInformationModel')
const { generateServiceToken } = require('../middleware/gatewayTokenGenerator')

const axios = require('axios')


module.exports = (socket, io) => {

    //GET PENDING INVOICE RECORDS
    const getInvoice = async (data) => {
        const result = await getPendingSalesData()
        socket.emit("receive_pending_invoice", result)
    }

    //GET NON PENDING INVOICE RECORDS
    const getNonPendingInvoice = async (data) => {
        const result = await getNonPendingRecords()
        socket.emit("receive_non_pending_invoice", result)
    }

    //ADD NEW INVOICE
    const createInvoice = async (data) => {
        
        try{
            const newInvoice = new invoiceRecords ({   customerAddress: data.customerAddress,
                customerContact: data.customerContact,
                customerId: data.customerId,
                customerName: data.customerName,
                deliveryDate: data.deliveryDate,
                discounts: data.discounts, 
                dueDate: data.dueDate, 
                invoiceDate: data.invoiceDate, 
                items: data.items, notes: data.notes,
                orderDate: data.orderDate, 
                orderNumber: data.orderNumber, 
                shippingMethod: data.shippingMethod,
                paymentMethod: data.paymentMethod,
                subTotal: data.subtotal, 
                terms: data.terms,
                totalAmount: data.totalAmount})
            
            //RESPONSE INVOICE CREATED
            const response = await newInvoice.save()
            if(!response){
                socket.emit("response_create_invoice", response)
            }

            // SEND PURCHASE ORDER TO LOGISTIC 2
            const token = generateServiceToken()
            const sendPurchaseOrder = await axios.post('https://gateway.jjm-manufacturing.com/logistic2/purchase-order-update', response, {
                headers: {Authorization: `Bearer ${token}`}
            })
            if(!sendPurchaseOrder){
                return socket.emit('invoice_error', {message: 'Failed to send purchase order to Logistic 2'})
            }

            await orderInformationRecords.findOneAndDelete({ orderNumber: response.orderNumber})
            const resultDelete = await orderInformationRecords.find({}).sort({ createdAt: -1})
            const length = resultDelete.length
            io.emit('receive_orders_length', length)
            io.emit('receive_orders', resultDelete)
            socket.emit("response_create_invoice", response)
            
            //RESPONSE PENDING INVOICE
            const resultPending = await getPendingSalesData()
            io.emit("receive_pending_invoice", resultPending)

            //RESPONSE NON PENDING INVOICE
            const resultNonPending = await getNonPendingRecords()
            io.emit("receive_non_pending_invoice", resultNonPending)
            
            // IO EMIT FOR PURCHASE ORDER DUPLICATION
            const result = await purchaseOrderDuplication()
            io.emit('receive_po_duplicaiton', result)
            const totalAnomalies = await totalLength()
            io.emit('receive_total_anomalies', totalAnomalies)
        }
        catch(err){
            console.log(err.message)
            return socket.emit('invoice_error', {message: 'Server Error'})
        }
    }

    //LISTEN EVENTS
    socket.on("create_invoice", createInvoice)
    socket.on("get_pending_invoice", getInvoice)
    socket.on("get_non_pending_invoice", getNonPendingInvoice)
}