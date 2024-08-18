require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const sampleRoutes = require('./Routes/sample')

//Express App
const app = express()

//Time logs
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
}

//Middlewares
app.use(cors())
app.use(express.json())
app.use((req,res,next) => {
    console.log(`[${getCurrentDateTime()}]`, req.path, req.method)
    next()
})


//API Endpoints
app.use('/API/Sample', sampleRoutes)



//DB connection
mongoose.connect(process.env.MONGGO_URI)
.then((result) => {
    app.listen(process.env.PORT, () => {
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
        console.log(`[${getCurrentDateTime()}] connected to db & listening to the port`, process.env.PORT);
    })
})
.catch((err) => {
    console.log(err)
})