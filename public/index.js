window.onload = function(){
    let exampleSocket; 
    //let startButton = document.querySelector("#startBtn")
    //let edit = document.querySelector("#inputEdit")
    let remoteText = document.querySelector("#remoteText");
    let callButton =  document.querySelector("#connect")
    let clearButton =  document.querySelector("#disconnect")
    let dialogBox = document.getElementById("dialog")
    ////-remote console begin
    let sendMessageButton = document.querySelector("#send_message");
    let receivedText = document.querySelector('#terminalOutput');
    let inputText =  document.querySelector('#terminalInput');
    ////-end
    let usrNameTitle = document.querySelector(".usr_name");
    let remoteCallTitle = document.querySelector(".remote_call_title")
    let abonentName='*'
    ////RTC objects f{
 

    let abonentConnection =  {
                     connection:false,
                    dataChannel:false,
    };

    let collectionICE = [];
    // }
    let callInfo={incoming: false}

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


      function isRcConnectionActive(rtc_conn){
        if(!rtc_conn){
            return false
        }
        const st = rtc_conn.conn.connectionState
        if ( (st != 'disconnected') || (st != 'failed') || (st !='closed')) {
             return true
        } else{
            return false
        }
      }
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
        return usrId | 0
    }

      //IMPORTANT: the UI must be blocked - when you send any data to server
      //until server response with the new access token to actualize new token.

     function onIncomingMsg (data) {
       receivedText.innerText = data.data;
       let child = document.createElement('div');
       child.classList.add(  'm-1', 'p-1', 'receiver-message', 'w-75', 'align-self-end', 'text-end');
       let usrName = document.createElement('div');
       usrName.classList.add('m-1','fw-bold','fst-italic');

       if (callInfo.incoming) {
           usrName.innerText = getNameById(callInfo.from);
       } else {
           usrName.innerText = getNameById(callInfo.to);
       }
       let message = document.createElement('div');
       message.classList.add('m-1');
       message.innerText = data.data;
       child.appendChild(usrName);
       child.appendChild(message);
       dialogBox.appendChild(child);
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
        if (!child){
            return false
        }
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

    function unlockUsrTextInput(){
                        //unblocking text input
                        let rem001 = document.getElementById('remote-text-label');
                        rem001.classList.remove('d-none');
                        rem001 = document.getElementById('terminalInput');
                        rem001.removeAttribute('disabled')
    }

    function lockUsrTextInput(){
                        //unblocking text input
                        let rem001 = document.getElementById('remote-text-label');
                        rem001.classList.add('d-none');
                        rem001 = document.getElementById('terminalInput');
                        rem001.setAttribute('disabled','true')
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

 


    sendMessageButton.addEventListener('click',(evt)=>{
        let text = inputText.value
         //echo to screen
         let child = document.createElement('div');
       child.classList.add(  'm-1', 'p-1', 'caller-message', 'w-75', 'align-self-start', 'text-start');
       let usrName = document.createElement('div');
       usrName.classList.add('m-1','fw-bold','fst-italic');
        usrName.innerText = abonentName
       let message = document.createElement('div');
       message.classList.add('m-1');
       message.innerText = text;
       child.appendChild(usrName);
       child.appendChild(message);
       dialogBox.appendChild(child);

         
           abonentConnection.dataChannel.send(text)
       
    })
/********************CALL BUTTON************************************ */
    callButton.addEventListener('click',function (evt){
        //when incoming call:
        if (callInfo.incoming) {
            let remoteName = getNameById(callInfo.from)
             //clear pervious dialog
             dialogBox.replaceChildren();
            //A) clear call indicator
            callIndicatorOff()
            spinnerOn()
            //B) set text
           
            remoteText.innerText = `Establishing WEB rtc connection with ${remoteName}`
            //C) responds with confirm:
            let myId = getUsrId()
            let token1 = sessionStorage.getItem('auth');
            let msg = {type:'call_confirm', from: callInfo.to, to:callInfo.from , auth:token1}
            exampleSocket.send(JSON.stringify(msg))
          return
            
        } else {
            //caller phoned...
            //setting callerInfo object:
            // Get the <select> element
            const selectElement = document.getElementById('abonentSelect');
            // Get the selected option
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            remoteUsrId = selectedOption.value.slice(1)
            //setiing up remaote caller----
            callInfo.incoming = false;
            callInfo.to = remoteUsrId;
            callInfo.from = getUsrId();
            //-------------------------
            let remoteName = getNameById(callInfo.to)
            if(!remoteName){
                return
            }
            //blocking UI
            blockCallBtn()
            releaseClearBtn()
            spinnerOn()

            //sendind 'call_start' message to the signal server
            //new message:
            //1) read token
            const auth = sessionStorage.getItem('auth');
            const usrId = getUsrId()
            //2)set call info
            callInfo = {incoming:false, to:remoteUsrId, from:usrId  } 
            //3) message
            const msg = { type:"call_start", to: remoteUsrId ,from:usrId,  auth:auth}
            //4)set text on screen turn on spinner
            
            remoteText.classList.remove("text-danger");
            remoteText.innerText = `Dialing to -> ${remoteName}`
            //4)send to signal server
            exampleSocket.send(JSON.stringify(msg))
        }
        
    })
/***************************CLEAR BUTTON****************************************/
    clearButton.addEventListener('click', function (evt){
            lockUsrTextInput()
                //in case of dialling remote caller
            if (abonentConnection.connection) {
                abonentConnection.connection.close();
                collectionICE = []
                abonentConnection.connection=null
            }
            releaseCallBtn()
            blockClearBtn()
        
            //1) read token
            let token = sessionStorage.getItem('auth');
            //2) message
            let msg;
            if (callInfo.incoming) {
                 msg = { type:"call_reject", to:callInfo.from, from:callInfo.to , auth:token}
            } else{
                msg = {to:callInfo.to, from:callInfo.from, type:"call_reject",  auth:token}
            }
            //3)send to signal server
            exampleSocket.send(JSON.stringify(msg))
            //4) clear call string and remote caller object
            callInfo = false;
           remoteText.innerText = ' ';
            blockClearBtn()
            releaseCallBtn()
            spinnerOff()
            callIndicatorOff()
         

          //D) Clear remote object
          callInfo = {incoming:false}
    })

 
    
    exampleSocket.onclose=function(event){
        let errNode = document.querySelector(".err_string");
        errNode.classList.remove("d-none");
        errNode.innerText = `Connection closed with code: ${event.code} and reason: ${event.reason}`;
        let loginLink = document.querySelector("#loginlink");
        loginLink.classList.remove('d-none')
        lockUsrTextInput()
    }

    exampleSocket.onmessage=async function(evt){
        let msgObj = JSON.parse(evt.data);
        
        switch(msgObj.type){
            case 'u_name':
                abonentName = msgObj.name
                usrNameTitle.innerText = abonentName
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
                //has RTC been establised?
                if ( isRcConnectionActive( abonentConnection.connection)) {
                   JSON.stringify({ type:"call_reject", to:msgObj.from, from:msgObj.to , auth:sessionStorage.getItem('auth')});
                   
                }
                //1)save remote caller data
                callInfo = msgObj;
                callInfo.incoming = true
                //2)turn on spinner and assign name
                let remoteCallerName = getNameById(msgObj.from);
                remoteText.innerText = `Incoming dial <- ${remoteCallerName}`
                callIndicatorOn() 
                //3)unblock 'clear' button
                releaseClearBtn()
                break
            case "call_reject":
                lockUsrTextInput()
                //has a connection been established?
                if(abonentConnection.connection ){
                    abonentConnection.connection.close();
                    abonentConnection.connection=null
                   collectionICE = []
                   
                   return;
                    
                } 
                //1)clear remote calle object
                callInfo = false;
                //2)clear spinner and unblock buttons
                spinnerOff();
                callIndicatorOff()
                releaseCallBtn();
                blockClearBtn();
                remoteText.innerText = ' '
                //3)Do eny actions for disconnecting
                break;
            case "call_confirm":
                //caler phonning...
                //clear pervious dialog
                dialogBox.replaceChildren();
                //confirmation from receiver - end logical connection
                remoteText.innerText = `Establishing WEBRtc ${getNameById(callInfo.to)}.. `
                //A)Caller cerates RTC connection and generates an offer:
                let offer = await createCallerConnectionAndOffer(abonentConnection, stunConfig);
                //B) add listeners for ICE candidates
                abonentConnection.connection.onicecandidate = onIceCandidateAvaliable
                 abonentConnection.connection.onconnectionstatechange = connectionOnStateChange
                console.log(offer)
                //send offer to receiver
                 exampleSocket.send(JSON.stringify({     type:'rtc_offer',
                                                        offer: offer,
                                                        from: msgObj.to, 
                                                        to: msgObj.from, 
                                                        auth:sessionStorage.getItem('auth')
                                                 })); 
                collectionICE = [];
                break;
            case 'rtc_offer': 
                //offer from a caller
                console.log('caller =>> receiver (offer)')
                console.log(msgObj.offer)
                collectionICE = [];
                //C) receiver creates a RTC connection, apply offer , generates answer:
                createReceiverConnection(abonentConnection, stunConfig);
                //D) add listeners for ICE candidates
                 abonentConnection.connection.onicecandidate = onIceCandidateAvaliable
                 abonentConnection.connection.onconnectionstatechange = connectionOnStateChange
                //answer
                let answer = await createReceiverAnswer(abonentConnection, msgObj.offer);
                //??? E) receiver add listener for incoming data (text)
                ////addReceiverDataListener(receiverConnection, onIncomingMsg)
                //send answer to a caller:
                exampleSocket.send(JSON.stringify({ type:'rtc_answer',
                                                   answer: answer,
                                                    from: msgObj.to, 
                                                    to: msgObj.from, 
                                                    auth:sessionStorage.getItem('auth')
                                                 }));

                break;
            case 'rtc_answer':
                //caller receiving an answer from an receiver 
                console.log('receiver =>> caller (answer):')
                console.log(msgObj.answer)
                //F)set remote description
                await setCallerRemoteDescr(abonentConnection, msgObj.answer);
                break;
            case 'ice':
                //G) Apply ICE candidates to each other

                if (msgObj.caller) {
                    console.log('ICEs ->receiver', Date.now())
                    console.log(msgObj.candidates[0])

                    for (const cnd of msgObj.candidates) {
                        await applyIce(abonentConnection, cnd)
                    }
                   
                } else {
                    console.log('ICEs->caller', Date.now())
                    console.log(msgObj.candidates[0])
                    for (const cnd of msgObj.candidates) {
                        await applyIce(abonentConnection , cnd)
                    }
                }
                //unblocking text input
                unlockUsrTextInput();
             
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
        let loginLink = document.querySelector("#loginlink");
        loginLink.removeAttribute('d-none')
        lockUsrTextInput()
    }

    async function createCallerConnectionAndOffer (cObj, config) {
        //cObj - object with representation of connection  
        cObj.connection = new RTCPeerConnection(config)
        cObj.dataChannel = cObj.connection.createDataChannel("chat");
         //add event listeners for data channel
        cObj.dataChannel.onopen = dataChannelOnOpen
        cObj.dataChannel.onclose = dataChannelOnClose
        cObj.dataChannel.onerror = dataChannelOnError
        cObj.dataChannel.onmessage = dataChannelOnMessage

         let offer = await cObj.connection.createOffer()
         await cObj.connection.setLocalDescription(offer)
         return offer;

    }

     function createReceiverConnection (cObj, config ) {
           //cObj - object with representation of connection  
           cObj.connection = new RTCPeerConnection(config)
           cObj.connection.ondatachannel = (evt)=>{
            cObj.dataChannel = evt.channel
            cObj.dataChannel.onopen = dataChannelOnOpen
            cObj.dataChannel.onclose = dataChannelOnClose
            cObj.dataChannel.onerror = dataChannelOnError
            cObj.dataChannel.onmessage =  dataChannelOnMessage
           }
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
     

     async function applyIce(cObj, ice) {
        const candidate = new RTCIceCandidate(ice);
        await cObj.connection.addIceCandidate(candidate);
     }

     const onIceCandidateAvaliable=(event)=>{
        
                if (event.candidate) {
                    //save ICE in the array
                    collectionICE.push(event.candidate)

                }else{
                    if (callInfo.incoming) {
                        //send list of ICEs 
                        exampleSocket.send(JSON.stringify({auth:sessionStorage.getItem('auth') ,caller: false, type:"ice",from:callInfo.to, to:callInfo.from, candidates:collectionICE}))
                    } else {
                        //send list of ICEs 
                        exampleSocket.send(JSON.stringify({auth:sessionStorage.getItem('auth') ,caller: true, type:"ice",from:callInfo.from, to:callInfo.to, candidates:collectionICE}))
                    }
                   
                }
            }

 
     //receiver channel events--------------
     function dataChannelOnOpen(evt) {
        const txt = callInfo.incoming ? getNameById(callInfo.from) : getNameById(callInfo.to)
        remoteText.innerText = `Connection with ${txt} established and active!`
        remoteText.classList.remove('text-danger');
        remoteText.classList.add('text-success');
        spinnerOff();
        console.log('Data channel is open and ready to be used.');
        sendMessageButton.removeAttribute('disabled','true')
        blockCallBtn()
        releaseClearBtn()
     }

     function dataChannelOnClose(evt) {
        remoteText.classList.remove('text-success');
        remoteText.classList.add('text-danger');
        remoteText.innerText = `Connection closed!`
        sendMessageButton.setAttribute('disabled','true')
        releaseCallBtn()
        blockClearBtn()
        abonentConnection.dataChannel=null
         
    }

    function dataChannelOnMessage(evt) {
          //  receivedText.innerText = evt.data
          onIncomingMsg(evt);
    }

    function dataChannelOnError(evt) {
        remoteText.classList.remove('text-success');
        remoteText.classList.add('text-danger');
        remoteText.innerText = evt
        sendMessageButton.setAttribute('disabled','true')
    }

    function connectionOnStateChange(evt){
        if (abonentConnection.connection.connectionState === "disconnected") {
            console.log("Peer connection closed");
           abonentConnection.connection = null; // Clean up
        }
    }

   


}