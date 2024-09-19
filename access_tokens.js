const crypto = require('crypto');
const cookieParser = require('cookie-parser');
 

 newTokenForUser = async (dBase, usrId) =>{
    let newToken = await new Promise((resolve, reject) => {
                    //generate new token
                      crypto.randomBytes(4, (err, buf)=>{
                        if(!err){
                          resolve(buf)
                        }else{
                          reject(err)
                        }
                    })
                  
                });
        ///2)save in DB
        dBase.IdToken.set(usrId, newToken.readUInt32BE());
        //3)return the new token for client as  string
        return {auth: `${newToken.toString('hex')}${usrId.toString(16)}`, usrId:usrId}
  }

  validateToken = (dBase, auth)=>{
      //extarct authorization data
    let usrId =  parseInt(auth.slice(8), 16);
    let token = Buffer.from(auth.slice(0,8), 'hex');
     //get token by usrId
     let savedToken = dBase.IdToken.get(usrId);
     if (!savedToken) {
       //when token is not in DB
       return false
     }
        //compare access token
     return (token.readUint32BE() === savedToken) ? usrId : false
  }

  updateToken = async (dBase, usrId)=>{
      
        //generate new token
        let newToken = await new Promise((resolve, reject) => {
          crypto.randomBytes(4,(er, buf)=>{
            if (er) {
              reject(er)
            } else {
              resolve(buf)
            }
          })
      });  
      ///2)save in DB
      dBase.IdToken.set(usrId, newToken.readUInt32BE());
      //3)return the new token for client as  string
      return  `${newToken.toString('hex')}${usrId.toString(16)}` 

  }

 ////can be removed
  validateAndUpdateToken = async (dBase, auth) =>{
    //extarct authorization data
    let usrId =  parseInt(auth.slice(8), 16);
    let token = Buffer.from(auth.slice(0,8), 'hex');
     //get token by usrId
     let savedToken = dBase.IdToken.get(usrId);
     if (!savedToken) {
       //when token is not in DB
       return false
     }
        //compare access token
     if (token.readUint32BE() === savedToken) {
        //generate new token
        let newToken = await new Promise((resolve, reject) => {
                              crypto.randomBytes(4,(er, buf)=>{
                                if (er) {
                                  reject(er)
                                } else {
                                  resolve(buf)
                                }
                              })
                          });  
         ///2)save in DB
         dBase.IdToken.set(usrId, newToken.readUInt32BE());
         //3)return the new token for client as  string
         return {auth: `${newToken.toString('hex')}${usrId.toString(16)}`, usrId:usrId}
     } else{
      return false
     }
  
  }

  //checking token(from cookie), re-generate it,
//sends to a client message with a new access token
//--this function may be used for incoming WS messages authentication--
  newConnectionTokenCheck=( authData, dbase)=>{
    
     
    if (!authData) {
      //when cookie is not
      return false
    }
    

    let usrId = parseInt(authData.slice(8),16);
    let token = Buffer.from(authData.slice(0,8),'hex');
    if (!usrId || !token) {
      //when cookie hasan`t fields 
      return false
    }
    //get token by usrId
    let savedToken = dbase.IdToken.get(usrId);
    if (!savedToken) {
      //when token is not in DB
      return false
    }
        //compare access token
    if (token.readUInt32BE() === savedToken) {
      //---s u c c e s s !!!---
        return usrId
    }else {
      //fail
      return false
    }

}

  loginToken = async (req,  dBase)=>{
   
        if (req.body.name && req.body.password) {
            let usrId = dBase.NameId.get(req.body.name);
            
            if (!usrId) {
              
             return false
            }
            let password = req.body.password;
            //is the password correct?
            if (dBase.IdPassword.get(usrId) === password) {
                //generate token
            let token =  await new Promise((resolve, reject) => {
                                crypto.randomBytes(4,(err,buf)=>{
                                if(err){
                                    reject(err)
                                }else{
                                    resolve(buf)
                                }
                            });
                         });
             
                //save token in db
                dBase.IdToken.set(usrId,  token.readUInt32BE());
                //assign new token to cookie
                //---token format:
                //[token(4),userId(4)]
                //res.cookie("auth",`${token.toString('hex')}${usrId.toString(16)}`,{ maxAge: 900000, httpOnly: false })
                return `${token.toString('hex')}${usrId.toString(16)}`
            }
        }
       return false
  
   
}

module.exports= {loginToken ,newTokenForUser,  validateToken, updateToken, newConnectionTokenCheck}