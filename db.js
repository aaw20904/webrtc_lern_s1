 
const crypto = require('crypto'); //cryptography - generate key pairs, encrypt/ decrypt / randomBytes()
const mysqlPromise = require('mysql2/promise');

class credentialMgr {
    #bdPool;
      constructor(par={basename:'webrtc_text', password:"32768", user:"root", host:"localhost"}){
          this.#bdPool = mysqlPromise.createPool({
            host: par.host,
            user: par.user,
            password: par.password,
            database: par.basename,
            connectionLimit: 10 // Specify the maximum number of connections in the pool
        
          });
          this._LIVE_TIME=20000|0
    }


    getMysqlPool(){
        return this.#bdPool;
    }
   
    //****************OK! tested
    async closeDatabase(){
         await this.#bdPool.end();
         return
     }

       
    async hashPassword (passw, salt){
        //salt - 32bytes
          return new Promise((resolve, reject) => {
              crypto.pbkdf2 (passw, salt, 10000, 64, 'sha512', (err, buf)=>{
                if (err) {
                    reject(err)
                } else {
                   resolve(buf);
                }
              })
          });
    }
   //compare entered and saved passwords and returns {result, usr_id}
   //TEST OK
    async checkUserPassword(user_name, password){
        
        let connection = await this.#bdPool.getConnection();
        if(!connection){
            throw new Error('POOL full!')
        }
        let result = await connection.query(`SELECT passw, salt, usr_cred.usr_id FROM usr_cred 
                INNER JOIN name_id ON name_id.usr_id=usr_cred.usr_id WHERE name_id.usr_name=?;`,[user_name]);
          connection.release();     
                if(!result[0][0]){
                    //when user not found
                  
                    return {status: false, usrID:null}
                }        
        let hashedPsw = await this.hashPassword(password, result[0][0].salt);
        let eq = hashedPsw.equals(result[0][0].passw);
        return {status: eq, usrId: result[0][0].usr_id};

    }

   async usrNewAccessToken (usrId) {
         let newToken = await new Promise((resolve, reject) => {
            crypto.randomBytes(16,(err,buf)=>{
                if (err) { 
                    reject(err)
                } else {
                    resolve(buf)
                }
            })
        });
        const epoch = Math.floor(Date.now()/1000)|0;
        let lastUpd = Buffer.allocUnsafe(4)
        lastUpd.writeUInt32LE(epoch);
        let connection = await this.#bdPool.getConnection();
        let result = await connection.query(`UPDATE usr_cred SET token=?, last_updated=? WHERE usr_id=?`,[newToken,lastUpd,usrId]);
         connection.release();
        let hextoken =  `${newToken.toString('hex').padStart(32,'0')}${usrId.toString(16).padStart(8,'0')}` 
        
        return hextoken

    }

   async usrValidateAccessToken (hextoken) {
           //extarct authorization data
        let usrId =  parseInt(hextoken.slice(32), 16);
        let token = Buffer.from(hextoken.slice(0,32), 'hex');
           // 
           let connection = await this.#bdPool.getConnection();
           let result = await connection.query(`SELECT token, last_updated FROM usr_cred WHERE usr_id=?;`,[usrId]);
           connection.release();
           if( result[0].length == 0 ){
               //user not found
               return {status: false, usrId:null}
           }
           let epoch  = result[0][0].last_updated.readUint32LE();
           //has the livetime been ellpsed?
           let currentEpoch = Math.floor(Date.now()/1000);
   
           if( (currentEpoch - epoch) > this._LIVE_TIME) {
               //livetime ellapsed
               return {status: false, usrId:null}
           }
   
           if (! result[0][0].token.equals(token) ) {
               //when tokens are not equal
               return {status: false, usrId:null}
           }
            
           return {status:true, usrId:usrId}
    }
    //token must be a buffer
//test ok

    async validateAndUpdateToken(hextoken) {
        //extarct authorization data
        let usrId =  parseInt(hextoken.slice(32), 16);
        let token = Buffer.from(hextoken.slice(0,32), 'hex');
        let connection = await this.#bdPool.getConnection();
        let result = await connection.query(`SELECT token, last_updated FROM usr_cred WHERE usr_id=?;`,[usrId]);
        if( result[0].length == 0 ){
            //user not found
            connection.release();
            return {status: false, token:null}
        }
        let epoch  = result[0][0].last_updated.readUint32LE();
        //has the livetime been ellpsed?
        let currentEpoch = Math.floor(Date.now()/1000);

        if( (currentEpoch - epoch) > this._LIVE_TIME) {
            //livetime ellapsed
            connection.release();
            return {status: false, token:null}
        }

        if (! result[0][0].token.equals(token) ) {
            //when tokens are not equal
            connection.release();
            return {status: false, token:null}
        }
        let binCurrEpoch = Buffer.allocUnsafe(4);
        binCurrEpoch.writeUInt32LE(currentEpoch);
        ///generate new token
        let newToken = await new Promise((resolve, reject) => {
            crypto.randomBytes(16,(err,buf)=>{
                if (err) { 
                    connection.release();
                    reject(err)
                }else {
                  resolve(buf)
                }
            })
        });

        //update DB
        result = await connection.query(`UPDATE usr_cred SET 
              token=?, last_updated=? WHERE usr_id=?;`,[newToken, binCurrEpoch, usrId]);
        connection.release();
        return {status:true, token:newToken}
    }

 

    async getUsrNameById(id){
        let connection = await this.#bdPool.getConnection();
        let result = await connection.query(`SELECT usr_name FROM name_id WHERE usr_id=?;`,[id]);
        connection.release();
        if(result[0].length < 1){
            return false
        }else {
            return result[0][0].usr_name
        }
    }

      //TEST OK
    async adminUpdateCredentialsForUser(usrId, password){
        //generate salt
        const salt = await new Promise((resolve, reject) => {
            crypto.randomBytes(32, (err,buff)=>{
                if(err){
                    reject(err)
                }else{
                    resolve(buff);
                }
            })
        });

        const hashedPassword = await this.hashPassword(password, salt)
        //timestamp, epoch, converting to buffer
        let lastUpdatedEpoch = Math.floor(Date.now() / 1000)|0;
        let lastUpdated = Buffer.allocUnsafe(4);
        lastUpdated.writeUInt32LE(lastUpdatedEpoch); 
        //access token
        let token = await new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err,buff)=>{
                if(err){
                    reject(err)
                }else{
                    resolve(buff);
                }
            })
        }); 
        ///update data in DB
        let connection = await this.#bdPool.getConnection();
        let queryResult = await connection.query(`INSERT INTO usr_cred (usr_id, passw, token, last_updated, salt) VALUES (?,?,?,?,?)
                                                 ON DUPLICATE KEY UPDATE  passw=?, token=?,
                                                  last_updated=?, salt=?; `,
                                                  [usrId, hashedPassword, token, lastUpdated, salt, hashedPassword, token, lastUpdated, salt]);
        connection.release();
    }

}



 module.exports={credentialMgr}