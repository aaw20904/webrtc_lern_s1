//****Handlers for messages-events
 
  
   const onTxt= (dBase,usrId )=>{
       //generate response with data and new access token and timestamp
       let responseMsg = {type: "txt",  data: Date.now().toString()}
       let targetSocket = dBase.IdConnection.get(usrId)
       targetSocket.send(JSON.stringify(responseMsg));
    }
  
    const onCallStart= async (dBase, msg)=>{
         //re-send message to the adressat
         //A) adressat ID
         let newToken = await dBase.sql_db.usrNewAccessToken( msg.to );
         //B)refresh token
          msg.auth= newToken 
         let whom = dBase.IdConnection.get(Number(msg.to));
         whom.send(JSON.stringify(msg));
         return
    }
     //NOTE:logical connection
     
  
    const onCallReject =async (dBase, msg)=>{
      //A) adressat ID
      let newToken = await dBase.sql_db.usrNewAccessToken( msg.to );
      //B)refresh token
       msg.auth= newToken
           //re-send message to the adressat
           let whom = dBase.IdConnection.get(Number(msg.to));
           whom.send(JSON.stringify(msg));
           return
    }
   
  //NOTE: logical connection
   const onCallConfirm= async (dBase, msg)=>{
    //A) adressat ID
    let newToken = await dBase.sql_db.usrNewAccessToken( msg.to );
    //B)refresh token
     msg.auth= newToken
      //re-sending confirmation to the caller
      let caller = dBase.IdConnection.get(Number(msg.to));
      caller.send(JSON.stringify(msg))
  
    }
  
   const onRtcOffer = async (dBase, msg)=>{
      //A) adressat ID
      let newToken = await dBase.sql_db.usrNewAccessToken( msg.to );
      //B)refresh token
       msg.auth= newToken
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
  
  