module.exports = (socket, io) => {

    socket.on("testing", (data) => {
        console.log(data)
        io.emit("sendTesting", {msg: "mas bobo ka tanginamo ba?"})
    })
}