window.onload = function(){
    const exampleSocket = new WebSocket("wss://localhost:443");
    let startButton = document.querySelector("#startBtn")
    let edit = document.querySelector("#inputEdit")
    let remoteText = document.querySelector("#remoteText");

    startButton.addEventListener("click",(evt)=>{
        //new message:
         //1) read token
         const auth = Cookies.get('auth');
         //2) message
         const msg = {auth:auth, type:"txt", data:edit.value}
        exampleSocket.send(JSON.stringify(msg));
    })
    
    exampleSocket.onclose=(event)=>{
        console.log(`Connection closed with code: ${event.code} and reason: ${event.reason}`);
    }

    exampleSocket.onmessage=(evt)=>{
        let msgObj = JSON.parse(evt.data);
        //assign new value of token that has been received to cookies
        Cookies.set('auth', msgObj.auth, { expires: 1, path: '/', secure: true, sameSite: 'Strict' });
        switch(msgObj.type){
            case "txt":
                remoteText.innerHTML = msgObj.data;    
            break;
            default:
        }
       

    }



    exampleSocket.onopen = (event) => {
        ///register in server:
       
        console.log(`registered`);
         
    };

    exampleSocket.onerror=(e)=>{
        console.log(e);
    }

}