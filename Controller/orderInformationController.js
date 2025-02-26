const orderInformationRecords = require('../Model/orderInformationModel')


// POST NEW ORDER
const newOrder = async (req, res) => {
    try{
        const { 
            orderNumber,
            customerId, 
            customerName, 
            customerAddress,
            orders, 
            contactInformation, 
            orderDate, 
            deliveryDate, 
            shippingMethod, 
            paymentMethod } = req.body

    const newOrder = new orderInformationRecords({
        orderNumber,
        customerId, 
        customerName, 
        customerAddress,
        orders, 
        contactInformation, 
        orderDate, 
        deliveryDate, 
        shippingMethod, 
        paymentMethod
    })

    const saveOrder = await newOrder.save()

    if(saveOrder){
        const result = await orderInformationRecords.find({}).sort({ createdAt: -1})
        const length = result.length
        req.io.emit('receive_orders_length', length)
        req.io.emit('receive_orders', result)
        res.status(200).json({ msg: `Order Number: ${saveOrder.orderNumber} is received`})
    }
    }
    catch(err){
        console.error('Receive new orders:', err.message)
        res.status(400).json({ errMsg: err.message})
    }
}

module.exports = {
    newOrder
}