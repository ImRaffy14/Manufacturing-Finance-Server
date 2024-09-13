require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const sampleRoutes = require('./Routes/sample')
const { Server } = require('socket.io')
const  http  = require('http')

//Express App
const app = express()

//Controllers & Routes
const testingSocketController = require("./Controller/testingSocketController")


//Middlewares
app.use(cors())
app.use(express.json())


//Socket Server
const server = http.createServer(app)
const io = new Server(server, {
  cors:{
    origin:"*",
    methods: ['GET', 'POST']
  }
})



//ASCII ART
const asciiArt = `
 __       __  ________  __         ______    ______   __       __  ________        ________  ______          ______   __    __  _______          ______   ________  _______   __     __  ________  _______  
/  |  _  /  |/        |/  |       /      \\  /      \\ /  \\     /  |/        |      /        |/      \\        /      \\ /  |  /  |/       \\        /      \\ /        |/       \\ /  |   /  |/        |/       \\ 
$$ | / \\ $$ |$$$$$$$$/ $$ |      /$$$$$$  |/$$$$$$  |$$  \\   /$$ |$$$$$$$$/       $$$$$$$$//$$$$$$  |      /$$$$$$  |$$ |  $$ |$$$$$$$  |      /$$$$$$  |$$$$$$$$/ $$$$$$$  |$$ |   $$ |$$$$$$$$/ $$$$$$$  |
$$ |/$  \\$$ |$$ |__    $$ |      $$ |  $$/ $$ |  $$ |$$$  \\ /$$$ |$$ |__             $$ |  $$ |  $$ |      $$ |  $$ |$$ |  $$ |$$ |__$$ |      $$ \\__$$/ $$ |__    $$ |__$$ |$$ |   $$ |$$ |__    $$ |__$$ |
$$ /$$$  $$ |$$    |   $$ |      $$ |      $$ |  $$ |$$$$  /$$$$ |$$    |            $$ |  $$ |  $$ |      $$ |  $$ |$$ |  $$ |$$    $$<       $$      \\ $$    |   $$    $$< $$  \\ /$$/ $$    |   $$    $$< 
$$ $$/$$ $$ |$$$$$/    $$ |      $$ |   __ $$ |  $$ |$$ $$ $$/$$ |$$$$$/             $$ |  $$ |  $$ |      $$ |  $$ |$$ |  $$ |$$$$$$$  |       $$$$$$  |$$$$$/    $$$$$$$  | $$  /$$/  $$$$$/    $$$$$$$  |
$$$$/  $$$$ |$$ |_____ $$ |_____ $$ \\__/  |$$ \\__$$ |$$ |$$$/ $$ |$$ |_____          $$ |  $$ \\__$$ |      $$ \\__$$ |$$ \\__$$ |$$ |  $$ |      /  \\__$$ |$$ |_____ $$ |  $$ |  $$ $$/   $$ |_____ $$ |  $$ |
$$$/    $$$ |$$       |$$       |$$    $$/ $$    $$/ $$ | $/  $$ |$$       |         $$ |  $$    $$/       $$    $$/ $$    $$/ $$ |  $$ |      $$    $$/ $$       |$$ |  $$ |   $$$/    $$       |$$ |  $$ |
$$/      $$/ $$$$$$$$/ $$$$$$$$/  $$$$$$/   $$$$$$/  $$/      $$/ $$$$$$$$/          $$/    $$$$$$/         $$$$$$/   $$$$$$/  $$/   $$/        $$$$$$/  $$$$$$$$/ $$/   $$/     $/     $$$$$$$$/ $$/   $$/ 
`.trim();



//WELCOMING API
app.get('/', (req, res) => {
    res.send(`
    <html>
      <head>
        <style>
          body {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #000; /* Optional: Set background color */
            color: #00FF00; /* Optional: Set text color */
            font-family: monospace;
          }
          pre {
            text-align: center;
            margin-top: 50px;
          }
        </style>
      </head>
      <body>
        <pre>${asciiArt}</pre>
        <pre>developed by: ImRaffy.dev</pre>
      </body>
    </html>
  `) 

  
})


//API ENDPOINTS
app.use(process.env.API_SAMPLE, sampleRoutes)


//DB connection
mongoose.connect(process.env.MONGGO_URI)
.then((result) => {
    server.listen(process.env.PORT, () => {
        console.log(`
 $$$$$$\\               $$$$$$$\\             $$$$$$\\   $$$$$$\\                     $$\\                     
 \\_$$  _|              $$  __$$\\           $$  __$$\\ $$  __$$\\                    $$ |                    
   $$ |  $$$$$$\\$$$$\\  $$ |  $$ | $$$$$$\\  $$ /  \\__|$$ /  \\__|$$\\   $$\\     $$$$$$$ | $$$$$$\\ $$\\    $$\\ 
   $$ |  $$  _$$  _$$\\ $$$$$$$  | \\____$$\\ $$$$\\     $$$$\\     $$ |  $$ |   $$  __$$ |$$  __$$\\\\$$\\  $$  |
   $$ |  $$ / $$ / $$ |$$  __$$<  $$$$$$$ |$$  _|    $$  _|    $$ |  $$ |   $$ /  $$ |$$$$$$$$ |\\$$\\$$  / 
   $$ |  $$ | $$ | $$ |$$ |  $$ |$$  __$$ |$$ |      $$ |      $$ |  $$ |   $$ |  $$ |$$   ____| \\$$$  /  
 $$$$$$\\ $$ | $$ | $$ |$$ |  $$ |\\$$$$$$$ |$$ |      $$ |      \\$$$$$$$ |$$\\\\$$$$$$$ |\\$$$$$$$\\   \\$  /   
 \\______|\\__| \\__| \\__|\\__|  \\__| \\_______|\\__|      \\__|       \\____$$ |\\__| \\_______| \\_______|  \\_/    
                                                               $$\\   $$ |                                 
                                                               \\$$$$$$  |                                 
                                                                \\______/                                           
        `);


      console.log(`connected to db & listening to the port`, process.env.PORT);

      io.on("connection", (socket) => {
        //User Connects
        console.log(`User is Connected ${socket.id}`)
        
        testingSocketController(socket, io)
        
         //User Disconnects
        socket.on("disconnect", () => {
          console.log(`Client disconnected ${socket.id}`)
        })
      })
    })
})
.catch((err) => {
    console.log(err)
})