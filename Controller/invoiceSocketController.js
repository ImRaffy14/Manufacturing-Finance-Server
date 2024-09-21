const invoiceRecords = require("../Model/invoiceRecordsModel")

module.exports = (socket, io) => {
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

            const response = await newInvoice.save()
            io.emit("response_create_invoice", response)
        }
        catch(err){
            console.log(err.message)
        }
    }

    //LISTEN EVENTS
    socket.on("create_invoice", createInvoice)
}