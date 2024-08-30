const fs = require('fs')
const WebSocket = require('ws');
const express = require('express');
const https = require('https');
let current, timer;

const options ={
      cert: fs.readFileSync('cert.crt'),
      key: fs.readFileSync('cert.key')
}
//create....
const app = express();
const server = https.createServer(options,app);//http server
 
var wss = new WebSocket.Server({ server });//WS server


// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static('public'));


// Start the server
server.listen(443, () => {
  console.log('Server listening on port 443');
});



wss.on('error', console.error);

wss.on('connection',function(conn){
    current = conn;
    timer = setInterval(()=>current.send(Date.now().toString()),3000)

    conn.on("message", function(data){
         console.log('received: ', data.toString());
         
    })
    conn.on('error', console.error);
    conn.on("close",()=>{
      clearInterval(timer);
    })
})

