const activeStaffRecords = require('../Model/activeStaffModel')
const blacklistedIp = require('../Model/blacklistedIpModel')
module.exports = (socket, io) => {

    const ip = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;

    // GET ACTIVE STAFF
    const getActiveStaff = async (data) => {
      const result = await activeStaffRecords.find({})
      socket.emit('receive_active_staff', result)
    }


    //LOGGING ONLINE OR ACTIVE STAFF
    const saveActiveStaff = async (data) => {

        try {
        //CHECK IF ALREADY SAVED
        const isSaved = await activeStaffRecords.findOne({ ipAddress: ip })
        if(isSaved) return

        const newAS = new activeStaffRecords({
            userId: data._id,
            username: data.userName,
            role: data.role,
            ipAddress: ip,
            socketId: socket.id
        })

        await newAS.save()

        const result = await activeStaffRecords.find({})
        io.emit('receive_active_staff', result)

        }
        catch (err) {
        if (err.code === 11000) {
          return
        } else {
          console.log('Error saving record:', err.message);
        }
      }
    }

    // REMOVED DISCONNECTED STAFF
    const staffDisconnect = async (data) => {
      try{
        const offlineStaff = await activeStaffRecords.findOneAndDelete({ ipAddress: ip })
        if(offlineStaff){
          const result = await activeStaffRecords.find({})
          io.emit('receive_active_staff', result)
        }
      }
      catch(error){
        console.error(`Staff Disconnect Error: ${error.message}`)
      }
    }

    // FORCE DISCONNECT STAFF
    const forceDisconnectStaff = async (data) => {
      try{
        await activeStaffRecords.findOneAndDelete({ ipAddress: data.ipAddress })
        io.to(data.socketId).emit("force_disconnect");
      }
      catch(error){
        console.error(`force disconnect staff error: ${error.message}`)
      }
    }
    
    // BAN STAFF
    const blockIpAddress = async (data) => {
      try{
        await blacklistedIp.create({
          userId: data.userId,
          username: data.username,
          ipAddress: data.ipAddress,
          banTime: Date.now(),
          banDuration: 0,
          banned: true
      })
          const blacklistRecords = await blacklistedIp.find({})
          io.emit('receive_blacklisted', blacklistRecords)
          await activeStaffRecords.findOneAndDelete({ ipAddress: data.ipAddress })
          io.to(data.socketId).emit("force_disconnect");
      }
      catch(error){
        console.error(`block IP address Manual Error: ${error.message}`)
      }
    }

    socket.on('block_ip_address', blockIpAddress)
    socket.on('force_disconnect_staff', forceDisconnectStaff)
    socket.on('get_active_staff', getActiveStaff)
    socket.on('save_active_staff', saveActiveStaff)
    socket.on('staff_disconnect', staffDisconnect)
}