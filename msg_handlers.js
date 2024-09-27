//****Handlers for messages-events
 
  
   const onTxt= (dBase,usrId )=>{
       //generate response with data and new access token and timestamp
       let responseMsg = {type: "txt",  data: Date.now().toString()}
       let targetSocket = dBase.IdConnection.get(usrId)
       targetSocket.send(JSON.stringify(responseMsg));
    }
  
    const onCallStart= (dBase, msg)=>{
         //re-send message to the adressat
         let whom = dBase.IdConnection.get(Number(msg.to));
         whom.send(JSON.stringify(msg));
         return
    }
     //NOTE:logical connection
     
  
    const onCallReject = (dBase, msg)=>{
           //re-send message to the adressat
           let whom = dBase.IdConnection.get(Number(msg.to));
           whom.send(JSON.stringify(msg));
           return
    }
   
  //NOTE: logical connection
   const onCallConfirm= (dBase, msg)=>{
      //re-sending confirmation to the caller
      let caller = dBase.IdConnection.get(Number(msg.to));
      caller.send(JSON.stringify(msg))
  
    }
  
   const onRtcOffer= (dBase, msg)=>{
      let addressat = dBase.IdConnection.get(Number(msg.to))
      addressat.send(JSON.stringify(msg))
    }
  
    const   onRtcAnswer= (dBase, msg)=>{
      let addressat = dBase.IdConnection.get(Number(msg.to))
      if(!addressat){
        return
      }
      addressat.send(JSON.stringify(msg))
    }

    const onIce = (dBase, msg)=>{
        let addressat = dBase.IdConnection.get(Number(msg.to))
      addressat.send(JSON.stringify(msg))
    }
  
  module.exports = {onRtcAnswer, onRtcOffer, onIce, onCallConfirm, onCallReject, onCallStart, onTxt}
  
  