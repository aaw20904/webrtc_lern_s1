const fs = require('fs')
const WebSocket = require('ws');
const express = require('express');
const https = require('https');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
let tokenLib =  require('./access_tokens') 
let handlersMsg = require("./msg_handlers")

let current, timer;



let users ={}

let db = {}
let savedData = fs.readFileSync("./idtoken.txt",{encoding:"utf-8"});
db.NameId= new Map();
db.IdName = new Map();
db.IdPassword = new Map();
  if (savedData.length > 1) {
    let arr = JSON.parse(savedData);
    db.IdToken = new Map(arr);
  }else{
    db.IdToken = new Map();
  }

db.IdConnection = new Map();
db.IdOnline = new Set() //ready or busy
////user 1
db.IdName.set(1000,"user1");
db.NameId.set("user1", 1000);
db.IdPassword.set(1000,'secret1');
////user 2
db.IdName.set(1001,"user2");
db.NameId.set("user2", 1001);
db.IdPassword.set(1001,'secret2');
////user 3
db.IdName.set(1002,"user3");
db.NameId.set("user3", 1002);
db.IdPassword.set(1002,'secret3');


const options ={
      cert: fs.readFileSync('cert.crt'),
      key: fs.readFileSync('cert.key')
}
//create....
const app = express();
const server = https.createServer(options,app);//http server
 
var wss = new WebSocket.Server({ server });//WS server


// Start the server
server.listen(443, () => {
  console.log('Server listening on port 443');
});


// Use cookie-parser middleware
app.use(cookieParser());
app.use(express.json());


//cookie analize
app.use((req, res, next)=>{
  console.log(req.cookies); // logs all cookies as an object
  //res.cookie('timeStamp', Date.now(), { maxAge: 900000, httpOnly: true });
  next();

})

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static('public'));
// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

//web-sockets

wss.on('error', console.error);

const failLogin =(res)=>{
  res.status(403)
  res.set('Content-Type', 'text/html');
  res.end(`<!DOCTYTE html> 
  <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <link rel="stylesheet" href="bootstrap.min.css">
        <link rel="stylesheet" href="index.css">
        <style>

      body{
        background-color: salmon;
        color:darkred !important;
      }

      
  </style>
</head>
  <body>
  <div class='d-flex h-100 flex-column justify-content-center align-items-center p-2'>
    <h2>Forbidden!</h2>
    <h5>Date:${new Date().toLocaleTimeString()}</h5>
  </div>
  </body>
</html>`)
}

const successLogin = (res)=>{
  res.status(201)
  res.set('Content-Type', 'text/html');
  res.end(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <link rel="stylesheet" href="bootstrap.min.css">
        <link rel="stylesheet" href="index.css">
        <style>
    
            body{
           background-color: aquamarine;
           color:darkgreen;
            }
     
            
        </style>
    </head>
    <body>
    <div class='d-flex flex-column justify-content-center align-items-center p-2'>
    <h2>You are loggges successfully!</h2>
    <h5>Date:${new Date().toLocaleTimeString()}</h5>
    <a href="./index.html">to main page</a>
       </div>
    </body>
    </html>`)
}

//login user
app.post("/login",async (req,res)=>{
  let token = await  tokenLib.loginToken(req, db)
  if (!token) {
    res.statusCode = 401;
    res.json({status:false})
    return
  }
  res.json( {
    status:true, auth:token
  })
 /*  if ( await tokenLib.loginToken(req, res, db)) {
    successLogin(res)
   } else {
    failLogin(res);
   }*/
 
})



//---------------notyfy all the abonents that the abonent is online/offline
 const notifyAbonents = (msgType, abonentId, dBase)=>{
  const name = dBase.IdName.get(abonentId)
  //iterate
   dBase.IdConnection.forEach((conn, idx)=>{
      if (abonentId != idx) {
        //notify all the abonents exclude who is cause
      
        const msg = JSON.stringify( {type:msgType, name:name, usrId:abonentId});
        conn.send(msg)
      }
   })
 
 }

 const giveExistsClientsToAbonent = (dBase, sock, usrId)=>{
  dBase.IdOnline.forEach((val,idx)=>{
    if(idx != usrId) {
        let name = dBase.IdName.get(idx);
        let msg = {type: 'online', name: name, usrId: idx }
        sock.send(JSON.stringify(msg))
         
    }
  })
 }
 


wss.on ('connection', function(sock, req) {
      // Extract query parameters from the request URL
      const url = new URL(req.url, `https://${req.headers.host}`);
      const token = url.searchParams.get('auth');

    let usrId = tokenLib.newConnectionTokenCheck(token,db)
    if (!usrId) {
      sock.close(4001,'Authentication failed!');
      return 
    }
    //  checkUserByWebSocks()
     //1)add custom property with userId to the connection object
    sock.usrId = usrId
    //2)save connection & status in Map
    db.IdConnection.set(usrId, sock);
    db.IdOnline.add(usrId);
    //3)give a name to the user
    const usrName = db.IdName.get(usrId);
    sock.send(JSON.stringify({type:'u_name', name:usrName}))
    //4) give to user list of  clients online
    giveExistsClientsToAbonent(db, sock, usrId);
    //5)notifying others that a new abonent in network
    notifyAbonents('online',usrId, db);
     

    sock.on("message", async function(data) {
      let msg = JSON.parse(data.toString("utf8"))
      //authenticate user
      let  usrId  =   tokenLib.validateToken(db, msg.auth)
      if (!usrId) {
        sock.close(4001,'Authentication failed!');
        return 
      }
      switch (msg.type) {
        case 'test':
          console.log(msg);
          await refreshAccessTokenInClient(db,usrId)
          break;
        case 'txt':
         handlersMsg.onTxt(db,  usrId)
         await refreshAccessTokenInClient(db,usrId)
        break;
        case "call_start":
          handlersMsg.onCallStart(db, msg)
          await refreshAccessTokenInClient(db,usrId)
          break;
        case 'call_confirm':
           handlersMsg.onCallConfirm(db, msg)
           await refreshAccessTokenInClient(db,usrId)
          break;
        case 'call_reject':
           handlersMsg.onCallReject(db, msg)
           await refreshAccessTokenInClient(db,usrId)
          break;
        case 'rtc_offer':
          handlersMsg.onRtcOffer(db, msg)
          await refreshAccessTokenInClient(db,usrId)
          break;
          case 'rtc_answer':
          handlersMsg.onRtcAnswer(db, msg)
          await refreshAccessTokenInClient(db,usrId)
          break;
        default:
          await refreshAccessTokenInClient(db,usrId)
      }
      
         
    })

    sock.on('error',(err)=>{ 
      console.log(err)
    });

    sock.on("close",()=>{
       //get id
       let id = sock.usrId
       //clean connection
       db.IdConnection.delete(id);
       db.IdOnline.delete(id);
       //notify others that an abonent leave
       notifyAbonents("leave", id, db)

    })
})
//***save cookie on disk */
setInterval(()=>{
    let idTokenArray = Array.from(db.IdToken);
    let jsonData =JSON.stringify(idTokenArray)
    fs.writeFileSync("./idtoken.txt",jsonData);
}, 2000)

async function refreshAccessTokenInClient(dBase, usrId){
   //AUTH: response with new token whom sent this message
   let callerSocket = dBase.IdConnection.get(usrId);
   let newToken = await tokenLib.updateToken(dBase, usrId);
   callerSocket.send(JSON.stringify({type:'token', auth:newToken}))
   //-------auth----------auth---------auth--------auth----------
}




