require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const sampleRoutes = require('./Routes/sample')
const { Server } = require('socket.io')
const  http  = require('http')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

//Express App
const app = express()

//Controllers & Routes
const testingSocketController = require("./Controller/testingSocketController")
const accountRoutes = require("./Routes/accounts")
const authRoutes = require("./Routes/auth")
const auditTrailRoute = require("./Routes/auditTrails")
const auditTrailSocket = require("./Controller/auditTrailSocketContoller")
const invoiceSocket = require("./Controller/invoiceSocketController")
const accountSocket = require("./Controller/accountSocketController")
const budgetRequestRoute = require("./Routes/budgetRequest")
const notificationLengthSocket = require("./Controller/notificationLengthSocketController")
const reviewPaymentTransactionSocket = require("./Controller/reviewPaymentTransactionSocketController")
const auditSocketController = require("./Controller/auditSocketContoller")
const budgetProcessingSocket = require("./Controller/budgetProcessingSocketController")
const viewCollectionSocket = require("./Controller/viewCollectionSocketController")
const monthlyCollectionJob = require("./CRON JOB/monthlyCollectionJob")
const dashboardAnalyticsSocket = require("./Controller/dashboardAnalyticSocketController")
const depositWithdrawSocket = require("./Controller/depositWithdrawSocketController")
const financialReportJob = require("./CRON JOB/financialReporting")
const financialReportSocket = require("./Controller/financialReportSocketController")
const recaptchaRoute = require("./Routes/recaptcha")
const activeStaffSocket = require("./Controller/activeStaffSocket")
const anomalyDetectionSocket = require("./Controller/anomalyDetectionSocketController")

//FOR TESTING
const { oRunAnomalyDetection } = require('./Controller/Anomaly-Detection/machine-learning/outflowAutoencoder')
const { iRunAnomalyDetection } = require('./Controller/Anomaly-Detection/machine-learning/inflowAutoencoder')
const { purchaseOrderDuplication, inflowDuplication, outflowDuplication, budgetRequestDuplication } = require('./Controller/Anomaly-Detection/rule-based/detectDuplication')
const { generateReport } = require('./Controller/Anomaly-Detection/machine-learning/generateReport')



//GET TIME
function getCurrentDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  return `${date} ${time}`;
}

//ALLOWED DOMAINS
const allowedOrigins = ['https://finance.jjm-manufacturing.com', 'http://localhost:5173'];

//Socket Server
const server = http.createServer(app)
const io = new Server(server, {
  cors:{
    origin:['https://finance.jjm-manufacturing.com', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})

//Middlewares
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json())
app.use((req,res,next) => {
  console.log(`[${getCurrentDateTime()}] ${req.headers.origin} |`, req.path, req.method)
  next()
})
app.use((req, res, next) => {
  req.io = io;
  next();
});




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
app.use(process.env.API_ACCOUNT, accountRoutes)
app.use(process.env.API_AUTH, authRoutes)
app.use(process.env.API_TRAILS, auditTrailRoute)
app.use(process.env.API_REQUEST_BUDGET, budgetRequestRoute)
app.use(process.env.API_RECAPTCHA, recaptchaRoute)

// FOR TESTING
app.get('/detect-anomalies', async (req, res) => {


  // Run anomaly detection
  const anomalies = await oRunAnomalyDetection();
  
  // Respond with the anomalies detected
  res.json({ success: true, anomalies });
});

app.get('/detect-anomalies-inflow', async (req, res) => {

  const anomalies = await iRunAnomalyDetection()

  res.json({ success: true, anomalies})
})

app.get('/detect-duplication', async (req, res) => {
  const duplication = await budgetRequestDuplication()

  res.json({success: true, duplication})
})

app.post('/generate-report', async (req, res) => {
  const { bobo } = req.body
  console.log(bobo)
  const result = await generateReport({
    date: '1/10/2025', 
    salesRevenue: 1,
    grossProfit: 1,
    totalCogs: 2,
    totalOperatingExpenses: 1,
    netCashFlow: 2,
    lmDate: "12/10/2024",
    lmSalesRevenue: 3,
    lmGrossProfit: 5,
    lmTotalCogs: 3,
    lmTotalOperatingExpenses: 2,
    lmNetCashFlow: 1
  })
  res.json({success: true, result})
})



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


      console.log(`[${getCurrentDateTime()}] connected to db & listening to the port`, process.env.PORT);

      io.on("connection", (socket) => {
        //User Connects
        console.log(`[${getCurrentDateTime()}] Client is Connected ${socket.id}`)
        
        testingSocketController(socket, io)
        auditTrailSocket(socket, io)
        invoiceSocket(socket, io)
        accountSocket(socket, io)
        notificationLengthSocket(socket, io)
        reviewPaymentTransactionSocket(socket, io)
        auditSocketController(socket, io)
        budgetProcessingSocket(socket, io)
        viewCollectionSocket(socket, io)
        monthlyCollectionJob(io)
        financialReportJob(io)
        dashboardAnalyticsSocket(socket, io)
        depositWithdrawSocket(socket, io)
        financialReportSocket(socket,io)
        activeStaffSocket(socket, io)
        anomalyDetectionSocket(socket, io)
        
         //User Disconnects
        socket.on("disconnect", () => {
          console.log(`[${getCurrentDateTime()}] Client disconnected ${socket.id}`)
        })
      })
    })
})
.catch((err) => {
    console.log(err)
})