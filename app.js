const fs = require('fs')
const WebSocket = require('ws');
const express = require('express');
const https = require('https');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
let tokenLib =  require('./access_tokens') 
let handlersMsg = require("./msg_handlers")
let crdMgr = require('./db');

let current, timer;



let users ={}

let db = {}
db.sql_db = new crdMgr.credentialMgr();

db.IdConnection = new Map();
db.IdOnline = new Set() //ready or busy
////user 1
 
 
 
////user 2
 
 
////user 3
 
 


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

 
//login user
app.post("/login",async (req,res)=>{
  ///---25.09{
    if (!req.body.name || !req.body.password) {
      res.statusCode = 401;
      res.json({status:false})
      return
    }
    ///validate password firstly
    let result = await db.sql_db.checkUserPassword(req.body.name, req.body.password) 
    if (!result.status){
      res.statusCode = 401;
      res.json({status:false})
      return
    }
    //vhen succes - assign a new token 
    let newToken = await db.sql_db.usrNewAccessToken(result.usrId)
    res.json({status:true, auth:newToken});

 
 
})



//---------------notyfy all the abonents that the abonent is online/offline
 const notifyAbonents = async (msgType, abonentId, dBase)=>{
  const name = await dBase.sql_db.getUsrNameById(abonentId);
  //iterate
   dBase.IdConnection.forEach((conn, idx)=>{
      if (abonentId != idx) {
        //notify all the abonents exclude who is cause
      
        const msg = JSON.stringify( {type:msgType, name:name, usrId:abonentId});
        conn.send(msg)
      }
   })
 
 }

 const giveExistsClientsToAbonent = async (dBase, sock, usrId)=>{

  for (const key of dBase.IdOnline) {
    if (key != usrId) {
        let name = await dBase.sql_db.getUsrNameById(key);
        let msg = {type: 'online', name: name, usrId: key }
        sock.send(JSON.stringify(msg)) 
    }
  }


 /* dBase.IdOnline.forEach(async (val,idx)=>{
    if(idx != usrId) {
        let name = dBase.IdName.get(idx);
        let msg = {type: 'online', name: name, usrId: idx }
        sock.send(JSON.stringify(msg))
         
    }
  })*/
 }
 


wss.on ('connection', async function(sock, req) {
      // Extract query parameters from the request URL
      const url = new URL(req.url, `https://${req.headers.host}`);
      const token = url.searchParams.get('auth');

    let chk = await db.sql_db.usrValidateAccessToken(token);
    if (!chk.usrId) {
      sock.close(4001,'Authentication failed!');
      
      return 
    }
    //  checkUserByWebSocks()
     //1)add custom property with userId to the connection object
    sock.usrId = chk.usrId
    //2)save connection & status in Map, add existing user to the key-value storage
    db.IdConnection.set(chk.usrId, sock);
    db.IdOnline.add(chk.usrId);
    //3)give a name to the user
    const usrName = await db.sql_db.getUsrNameById(chk.usrId);
    sock.send(JSON.stringify({type:'u_name', name:usrName}))
    //4) give to user list of  clients online
    giveExistsClientsToAbonent(db, sock, chk.usrId);
    //5)notifying others that a new abonent in network
    notifyAbonents('online',chk.usrId, db);
     

    sock.on("message", async function(data) {
      let msg = JSON.parse(data.toString("utf8"))
      //authenticate user
      let chk = await db.sql_db.usrValidateAccessToken(token);
      if (!chk.usrId) {
        sock.close(4001,'Authentication failed!');
        return 
      }
      switch (msg.type) {
        case 'test':
          console.log(msg);
          await refreshAccessTokenInClient(db,chk.usrId)
          break;
        case "call_start":
          handlersMsg.onCallStart(db, msg)
          await refreshAccessTokenInClient(db,chk.usrId)
          break;
        case 'call_confirm':
           handlersMsg.onCallConfirm(db, msg)
           await refreshAccessTokenInClient(db,chk.usrId)
          break;
        case 'call_reject':
           handlersMsg.onCallReject(db, msg)
           await refreshAccessTokenInClient(db,chk.usrId)
          break;
        case 'rtc_offer':
          handlersMsg.onRtcOffer(db, msg)
          await refreshAccessTokenInClient(db,chk.usrId)
          break;
          case 'rtc_answer':
          handlersMsg.onRtcAnswer(db, msg)
          await refreshAccessTokenInClient(db,chk.usrId)
          break;
          case 'ice':
            handlersMsg.onIce(db,msg)
            await refreshAccessTokenInClient(db,chk.usrId)
          break;
        default:
          await refreshAccessTokenInClient(db,chk.usrId)
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
 

async function refreshAccessTokenInClient(dBase, usrId){
   //AUTH: response with new token whom sent this message
   let callerSocket = dBase.IdConnection.get(usrId);
   let newToken =   await dBase.sql_db.usrNewAccessToken(usrId);
   callerSocket.send(JSON.stringify({type:'token', auth:newToken}))
   //-------auth----------auth---------auth--------auth----------
}




