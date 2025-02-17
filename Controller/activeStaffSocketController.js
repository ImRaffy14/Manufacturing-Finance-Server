const activeStaffRecords = require('../Model/activeStaffModel')
const blacklistedIp = require('../Model/blacklistedIpModel')
const { suspiciousLogin } = require('../Controller/Anomaly-Detection/rule-based/detectDuplication')
const UAParser = require("ua-parser-js");
const axios = require('axios')
const { verifyPassword } = require('../middleware/passwordVerification')

module.exports = (socket, io) => {

  const ip = socket.request.headers['x-forwarded-for']
  ? socket.request.headers['x-forwarded-for'].split(',')[0].trim()
  : socket.request.connection.remoteAddress;

  const userAgent = socket.request.headers["user-agent"];

  // Parse the User-Agent string
  const parser = new UAParser();
  parser.setUA(userAgent);
  const deviceInfo = parser.getResult();

  const deviceInformation = `${deviceInfo.device.model || "PC/Laptop"} / ${deviceInfo.browser.name} / ${deviceInfo.os.name}`


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
      
      // GET IP LOCATION
      const getLocation = await axios.get(`http://ip-api.com/json/${ip}`);
      const location = getLocation.data.status === 'success'
          ? `${getLocation.data.country} / ${getLocation.data.regionName} / ${getLocation.data.city}`
          : 'N/A';

      const newAS = new activeStaffRecords({
          userId: data._id,
          username: data.userName,
          role: data.role,
          ipAddress: ip,
          deviceInfo: deviceInformation,
          socketId: socket.id,
          location: location
      })

      await newAS.save()

      const result = await activeStaffRecords.find({})
      io.emit('receive_active_staff', result)

      const resultDuplication = await suspiciousLogin()
      io.emit('receive_suspicious_login', resultDuplication)

      }
      catch (err) {
      if (err.code === 11000) {
        return
      } else {
        console.log('Error Active Staff record:', err.message);
        socket.emit('active_staff_error')
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
        const resultDuplication = await suspiciousLogin()
        io.emit('receive_suspicious_login', resultDuplication)
      }
    }
    catch(error){
      console.error(`Staff Disconnect Error: ${error.message}`)
      socket.emit('active_staff_error')
    }
  }

  // FORCE DISCONNECT STAFF
  const forceDisconnectStaff = async (data) => {
    try{
      const user = await verifyPassword(data.userName, data.password)
      if(!user){
          return socket.emit('error_verification', {msg: 'Invalid Credentials'})
      }
      
      await activeStaffRecords.findOneAndDelete({ ipAddress: data.row.ipAddress })
      io.to(data.row.socketId).emit("force_disconnect");
      const result = await activeStaffRecords.find({})
      io.emit('receive_active_staff', result)
      socket.emit('active_staff_success', {msg: `Client is now disconnected`})

      const resultDuplication = await suspiciousLogin()
      io.emit('receive_suspicious_login', resultDuplication)
    }
    catch(error){
      console.error(`force disconnect staff error: ${error.message}`)
      socket.emit('active_staff_error')
    }
  }
  
  // BAN STAFF
  const blockIpAddress = async (data) => {
    try{
      const user = await verifyPassword(data.userName, data.password)
      if(!user){
          return socket.emit('error_verification', {msg: 'Invalid Credentials'})
      }

      await blacklistedIp.create({
        userId: data.row.userId,
        username: data.row.username,
        ipAddress: data.row.ipAddress,
        banTime: Date.now(),
        banDuration: 0,
        banned: true,
        deviceInfo: data.row.deviceInfo,
        location: data.row.location
    })
        const blacklistRecords = await blacklistedIp.find({})
        io.emit('receive_blacklisted', blacklistRecords)
        await activeStaffRecords.findOneAndDelete({ ipAddress: data.row.ipAddress })
        io.to(data.socketId).emit("force_disconnect");
        const result = await activeStaffRecords.find({})
        io.emit('receive_active_staff', result)
        socket.emit('active_staff_success', {msg: `Client is now blacklisted`})

        const resultDuplication = await suspiciousLogin()
        io.emit('receive_suspicious_login', resultDuplication)
    }
    catch(error){
      console.error(`block IP address Manual Error: ${error.message}`)
      socket.emit('active_staff_error')
    }
  }

  socket.on('block_ip_address', blockIpAddress)
  socket.on('force_disconnect_staff', forceDisconnectStaff)
  socket.on('get_active_staff', getActiveStaff)
  socket.on('save_active_staff', saveActiveStaff)
  socket.on('staff_disconnect', staffDisconnect)
}