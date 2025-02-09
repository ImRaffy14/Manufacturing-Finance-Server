const activeStaffRecords = require('../Model/activeStaffModel')

module.exports = (socket, io) => {

    const ip = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;

    const saveActiveStaff = async (data) => {

        try {
        //CHECK IF ALREADY SAVED
        const isSaved = await activeStaffRecords.findOne({ ipAddress: ip })
        if(isSaved) return

        const newAS = new activeStaffRecords({
            userId: data._id,
            username: data.userName,
            role: data.role,
            ipAddress: ip
        })

        await newAS.save()
          } catch (err) {
            if (err.code === 11000) {
              console.log('Duplicate IP address error');
            } else {
              console.log('Error saving record:', err.message);
            }
          }
    }

    const staffDisconnect = async (data) => {
    }

    socket.on('save_active_staff', saveActiveStaff)
    socket.on('staff_disconnect', staffDisconnect)
}