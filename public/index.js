window.onload = function(){
    const exampleSocket = new WebSocket("wss://localhost:443");
    let startButton = document.querySelector("#startBtn")
    let edit = document.querySelector("#inputEdit")
    let remoteText = document.querySelector("#remoteText");

      //IMPORTANT: the UI must be blocked - when you send any data to server
      //until server response with the new access token to actualize new token.
    function blockUI () {
        let btn = document.querySelector("#startBtn");
        let spinner = document.querySelector(".my_spinner")
        spinner.classList.remove('d-none')
        btn.setAttribute("disabled", "true");
    }

    

    function releaseUI () {
        let btn = document.querySelector("#startBtn");
        btn.removeAttribute("disabled");
        let spinner = document.querySelector(".my_spinner")
        spinner.classList.add('d-none')
    }
     ///********busy / ready***********************
    const applyAbonentAvaliabilyty = (usrId, name, status=true)=>{
      let parent = document.querySelector("#abonentSelect");
      //is the abonent already in  DOM list?
      let abonentItem = parent.querySelector(`#a${usrId}`)
      if (!abonentItem) {
         //create new item
         abonentItem = document.createElement("option")
         abonentItem.setAttribute("id", `a${usrId}`)
         abonentItem.setAttribute("value", `a${usrId}`)
         abonentItem.innerText = name;
         parent.appendChild(abonentItem)

      }
        if (status) {
            //when abonent ready 
                abonentItem.removeAttribute("disabled")
        } else {
            //when abonent ready
              abonentItem.setAttribute("disabled", "true")
        }
    
    } 

    const addOrUpdateFreeAbonent = (usrId) =>{

    }

    startButton.addEventListener("click",(evt)=>{
        blockUI()
        //new message:
         //1) read token
         const auth = Cookies.get('auth');
         //2) message
         const msg = { type:"txt", data:edit.value, auth:auth}
        exampleSocket.send(JSON.stringify(msg));
        
    })
    
    exampleSocket.onclose=(event)=>{
        let errNode = document.querySelector(".err_string");
        errNode.classList.remove("d-none");
        errNode.innerText = `Connection closed with code: ${event.code} and reason: ${event.reason}`;
       
    }

    exampleSocket.onmessage=(evt)=>{
        let msgObj = JSON.parse(evt.data);
        
        switch(msgObj.type){
            case "txt":
                remoteText.innerHTML = msgObj.data;    
            break;
     
            case "token":
                //assign new value of token that has been received to cookies
                Cookies.set('auth', msgObj.auth, { expires: 1, path: '/', secure: true, sameSite: 'Strict' });
                releaseUI()
            break; 
            case "a_busy":
                applyAbonentAvaliabilyty(msgObj.usrId, msgObj.name, false)
                break;
            case "a_ready":
                applyAbonentAvaliabilyty(msgObj.usrId, msgObj.name, true)
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