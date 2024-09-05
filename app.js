const fs = require('fs')
const WebSocket = require('ws');
const express = require('express');
const https = require('https');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

let current, timer;

let users ={}

let db = {}
db.NameId= new Map();
db.IdPassword = new Map();
db.IdTokenConnection = new Map();
////user 1
db.NameId.set("user1", 1000);
db.IdPassword.set(1000,'secret1');
////user 2
db.NameId.set("user2", 1001);
db.IdPassword.set(1001,'secret2');
////user 3
db.NameId.set("user2", 1002);
db.IdPassword.set(1002,'secret2');


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
app.post("/login",(req,res)=>{
  if (req.body.name && req.body.password) {
    let usrId = db.NameId.get(req.body.name);
     
    if (!usrId) {
      failLogin(res);
      return false
    }
    let password = req.body.password;
    //is the password correct?
    if(db.IdPassword.get(usrId) === password){
       //generate token 
       let token = crypto.randomBytes(5)
       
       //save token in db
       db.IdTokenConnection.set(usrId, {token:Number(token)});
       //assign new token to cookie
       //[token(8),userId(4)]
       res.cookie("auth",`${token.toString("hex")}${usrId.toString(16)}`,{ maxAge: 900000, httpOnly: true })
       successLogin(res)
       return true
    }
  }
  failLogin(res);
  return false
  //res.json(req.body)
})

//checking 
const checkUserByWebSocks=(wsock, req, db)=>{
    //read cookies
    let parser = cookieParser()
    parser(req,false,()=>true);
    //now cookies are in req.cookies
    //separate user id and a token
    let authData = req.cookies.auth;
    let usrId =  parseInt(authData.slice(10),16);
    let token = parseInt(authData.slice(0,9),16);

}

wss.on('connection',function(sock, req){
    
    //  checkUserByWebSocks()
    current = sock;
    timer = setInterval(()=>current.send(Date.now().toString()),3000)

    sock.on("message", function(data){
         console.log('received: ', data.toString());
         
    })
    sock.on('error', console.error);

    sock.on("close",()=>{
      console.log("Client disconnected")
      clearInterval(timer);
    })
})

