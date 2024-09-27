const invoiceRecords = require("../Model/invoiceRecordsModel")
const { getPendingSalesData, getNonPendingRecords } = require("../Model/invoiceAggregation")

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
                subTotal: data.subtotal, 
                terms: data.terms,
                totalAmount: data.totalAmount})
            
            //RESPONSE INVOICE CREATED
            const response = await newInvoice.save()
            socket.emit("response_create_invoice", response)
            
            //RESPONSE PENDING INVOICE
            const resultPending = await getPendingSalesData()
            io.emit("receive_pending_invoice", resultPending)

            //RESPONSE NON PENDING INVOICE
            const resultNonPending = await getNonPendingRecords()
            io.emit("receive_non_pending_invoice", resultNonPending)
            
        }
        catch(err){
            console.log(err.message)
        }
    }

    //LISTEN EVENTS
    socket.on("create_invoice", createInvoice)
    socket.on("get_pending_invoice", getInvoice)
    socket.on("get_non_pending_invoice", getNonPendingInvoice)
}