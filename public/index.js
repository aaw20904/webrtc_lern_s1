window.onload = function(){
    let exampleSocket; 
    let startButton = document.querySelector("#startBtn")
    let edit = document.querySelector("#inputEdit")
    let remoteText = document.querySelector("#remoteText");
    let callButton =  document.querySelector("#connect")
    let clearButton =  document.querySelector("#disconnect")
    ////-remote console begin
    let sendMessageButton = document.queryCommandIndeterm("#send_message");
    let receivedText = document.querySelector('.terminalOutput');
    let inputText =  document.querySelector('.terminalInput');
    ////-end
    let usrNameTitle = document.querySelector(".usr_name");
    let remoteCallTitle = document.querySelector(".remote_call_title")
    let userName='*'
    ////RTC objects f{
    let callerConnection = {
                            connection:false, 
                            dataChannel:false,
                        };
    let receiverConnection = {
                                connection:false,
                                 dataChannel:false,
                            };
    // }
    let remoteCaller={incoming: false}

     //STUN options
     const stunConfig = {
        iceServers: [
          {
            'urls': 'stun:stun.l.google.com:19302'
          },
          {
            'urls': 'stun:stun1.l.google.com:19302'
          }
        ]
      };
    //-----assign access token to the URL----------------
   
    const storedToken = sessionStorage.getItem('auth');
    exampleSocket =  new WebSocket(`wss://localhost:443/?auth=${storedToken}`);
    function getUsrId(){
        //1) read token
        const auth = sessionStorage.getItem('auth');
        if(!auth ){
            return false
        }
                //extarct authorization data
        let usrId =  parseInt(auth.slice(8), 16);
        return usrId
    }

      //IMPORTANT: the UI must be blocked - when you send any data to server
      //until server response with the new access token to actualize new token.

     function onIncomingMsg(data){
       receivedText.innerText = data.data
     } 

    function blockUI () {
        let buttons =document.getElementsByTagName('button');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute("disabled", "true");
        }
    
    }

    function getNameById(id){
        let parent = document.querySelector("#abonentSelect");
        let child = parent.querySelector(`#a${id}`);
        return child.innerText
    }

    function blockCallBtn (){
        let callButton =  document.querySelector("#connect")
        callButton.setAttribute('disabled','true')
    }

    function releaseCallBtn(){
        let callButton =  document.querySelector("#connect")
        callButton.removeAttribute("disabled")
    }

    function blockClearBtn(){
        let clearButton =  document.querySelector("#disconnect")
        clearButton.setAttribute('disabled','true')

    }

    function releaseClearBtn(){
        let clearButton =  document.querySelector("#disconnect")
        clearButton.removeAttribute("disabled")
    }

    function spinnerOn(){
        let spinner = document.querySelector("#my_spinner")
        spinner.classList.remove('d-none')
    }

    function spinnerOff(){
        let spinner = document.querySelector("#my_spinner")
        spinner.classList.add('d-none')
    }

    function callIndicatorOn(){
        let sp = document.querySelector("#call_spinner")
        sp.classList.remove('d-none')
    }

    function callIndicatorOff(){
        let sp = document.querySelector("#call_spinner")
        sp.classList.add('d-none')
    }

    

    function releaseUI () {
        let buttons =document.getElementsByTagName('button');
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].removeAttribute("disabled");
        }
 
    }
     ///********busy / ready***********************
    const applyAbonentAvaliable = (usrId, name )=>{
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
     
    
    } 

    //*****remove abonent */
    const removeAbonentFromList= (id)=>{
        let parent = document.querySelector("#abonentSelect");
      //is the abonent already in  DOM list?
      let abonentItem = parent.querySelector(`#a${id}`)
      if (abonentItem) {
        parent.removeChild(abonentItem);
      }
    }

    const addOrUpdateFreeAbonent = (usrId) =>{

    }


    

    callButton.addEventListener('click',function (evt){
        //when incoming call:
        if (remoteCaller.incoming) {
            //A) clear call indicator
            callIndicatorOff()
            spinnerOn()
            //B) set text
            let remoteName = getNameById(remoteCaller.from)
            remoteText.innerText = `Establishing WEB rtc connection with ${remoteName}`
            //C) responds with confirm:
            let myId = getUsrId()
            let token1 = sessionStorage.getItem('auth');
            let msg = {type:'call_confirm', from: remoteCaller.to, to:remoteCaller.from , auth:token1}
            exampleSocket.send(JSON.stringify(msg))
          return
            
        } else {
            //blocking UI
            blockCallBtn()
            releaseClearBtn()
            spinnerOn()
                // Get the <select> element
                const selectElement = document.getElementById('abonentSelect');
                // Get the selected option
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                remoteUsrId = selectedOption.value.slice(1)
            //sendind 'call_start' message to the signal server
            //new message:
            //1) read token
            const auth = sessionStorage.getItem('auth');
            const usrId = getUsrId()
            //2)set remoteeobject
            remoteCaller = {incoming:false, from:remoteUsrId, to:usrId  } 
            //3) message
            const msg = { type:"call_start", to: remoteUsrId ,from:usrId,  auth:auth}
            //4)set text on screen turn on spinner
            let remoteName = getNameById(remoteCaller.from)
            remoteText.innerText = `Dialing to -> ${remoteName}`
            //4)send to signal server
            exampleSocket.send(JSON.stringify(msg))
        }
        
    })

    clearButton.addEventListener('click',function (evt){
        
                //in case of dialling remote caller
            
            releaseCallBtn()
            blockClearBtn()
        
            //1) read token
            let token = sessionStorage.getItem('auth');
            //2) message
            let msg;
            if (remoteCaller.incoming) {
                 msg = { type:"call_reject", to:remoteCaller.from, from:remoteCaller.to , auth:token}
            } else{
                msg = {to:remoteCaller.to, from:remoteCaller.from, type:"call_reject",  auth:token}
            }
            //3)send to signal server
            exampleSocket.send(JSON.stringify(msg))
            //4) clear call string and remote caller object
            remoteCaller = false;
           remoteText.innerText = ' ';
            blockClearBtn()
            releaseCallBtn()
            spinnerOff()
            callIndicatorOff()
         

          //D) Clear remote object
          remoteCaller = {incoming:false}
    })

    startButton.addEventListener("click",function (evt){
        if (remoteCaller.incoming) {
            //A) clear call indicator
            callIndicatorOff()
            spinnerOn()
            //B) set text
            let remoteName = getNameById(remoteCaller.from)
            remoteText.innerText = `Establishing WEB rtc connection with ${remoteName}`
            //C) responds with confirm:
            let myId = getUsrId()
            let token1 = sessionStorage.getItem('auth');
            let msg = {type:'test', from:myId, auth:token1}
            exampleSocket.send(JSON.stringify(msg))
          return
            
        } 
        
    })
    
    exampleSocket.onclose=function(event){
        let errNode = document.querySelector(".err_string");
        errNode.classList.remove("d-none");
        errNode.innerText = `Connection closed with code: ${event.code} and reason: ${event.reason}`;
       
    }

    exampleSocket.onmessage=async function(evt){
        let msgObj = JSON.parse(evt.data);
        
        switch(msgObj.type){
            case 'u_name':
                userName = msgObj.name
                usrNameTitle.innerText = userName
                //block clear , unblock call
                blockClearBtn()
                releaseCallBtn()
                break;
            case "txt":
                remoteText.innerHTML = msgObj.data;    
                break;
     
            case "token":
                //assign new value of token that has been received to cookies
                //Cookies.set('auth', msgObj.auth, { expires: 1, path: '/', secure: true, sameSite: 'Strict' });
                sessionStorage.setItem('auth',msgObj.auth)
                break; 
            case "online":
                applyAbonentAvaliable(msgObj.usrId, msgObj.name)
                break
            case 'call_start':
                //1)save remote caller data
                remoteCaller = msgObj;
                remoteCaller.incoming = true
                //2)turn on spinner and assign name
                let remoteCallerName = getNameById(msgObj.from);
                remoteText.innerText = `Incoming dial <- ${remoteCallerName}`
                callIndicatorOn() 
                //3)unblock 'clear' button
                releaseClearBtn()
                break
            case "call_reject":
                //1)clear mote calle object
                remoteCaller = false;
                //2)clear spinner and unblock buttons
                spinnerOff();
                callIndicatorOff()
                releaseCallBtn();
                blockClearBtn();
                remoteText.innerText = ' '
                //3)Do eny actions for disconnecting
                break;
            case "call_confirm":
                //confirmation from receiver - end logical connection
                remoteText.innerText = `Establishing WEBRtc ${getNameById(remoteCaller.from)}.. `
                //A)Caller cerates RTC connection and generates an offer:
                let offer = await createCallerConnectionAndOffer(callerConnection, stunConfig);
                //send offer to receiver
                exampleSocket.send(JSON.stringify({ type:'rtc_offer',
                                                    offer: offer,
                                                    from: msgObj.to, 
                                                    to: msgObj.from, 
                                                    auth:sessionStorage.getItem('auth')
                                                 }));
                break;
            case 'rtc_offer': 
                //offer from a caller
                console.log('caller =>> receiver (offer)')
                console.log(msgObj.offer)
                //B) receiver creates a RTC connection, apply offer , generates answer:
                createReceiverConnection(receiverConnection, stunConfig);
                let answer = await createReceiverAnswer(receiverConnection, msgObj.offer);
                //C) receiver add listener for incoming data (text)
                addReceiverDataListener(receiverConnection, onIncomingMsg)
                //send answer to caller:
                exampleSocket.send(JSON.stringify({ type:'rtc_answer',
                                                   answer: answer,
                                                    from: msgObj.to, 
                                                    to: msgObj.from, 
                                                    auth:sessionStorage.getItem('auth')
                                                 }));

                break;
            case 'rtc_answer':
                //answer from receiver 
                console.log('receiver =>> caller (answer):')
                console.log(msgObj.answer)
                //D)set remote description
                await setCallerRemoteDescr(callerConnection,msgObj.answer);
                break;
            case "leave":
                removeAbonentFromList(msgObj.usrId)
                break;

            default:
        }
       

    }

    exampleSocket.onopen = function(event)  {
        ///register in server:
       
        console.log(`registered`);
         
    };

    exampleSocket.onerror=function(e){
        remoteCallTitle.innerText = e.message
    }

    async function createCallerConnectionAndOffer (cObj, config) {
        //cObj - object with representation of connection  
        cObj.connection = new RTCPeerConnection(config)
        cObj.dataChannel = cObj.connection.createDataChannel("chat");
         let offer = await cObj.connection.createOffer()
         await cObj.connection.setLocalDescription(offer)
         return offer;

    }

     function createReceiverConnection (cObj, config ) {
           //cObj - object with representation of connection  
           cObj.connection = new RTCPeerConnection(config)
     } 

     async function createReceiverAnswer(cObj, callerOffer) {
              const sessionDescription = new RTCSessionDescription(callerOffer);
              await cObj.connection.setRemoteDescription(sessionDescription);
              let answer = await cObj.connection.createAnswer();
              await cObj.connection.setLocalDescription(answer);
              return  answer;

     }

     async function setCallerRemoteDescr(cObj, answer){
        const sessionDescr = new RTCSessionDescription(answer);
        await cObj.connection.setRemoteDescription(sessionDescr)
     }
//onIncomingMsg
     function addReceiverDataListener(cObj, listener){
        cObj.connection.dataChannel.onmessage =listener
     }

     function onIceCandidateAvaliable(event){
        //set event to server
        exampleSocket.send(JSON.stringify({type:"ice",from:remoteCaller.to, to:remoteCaller.from, candidate:event.candidate}))
     }


}