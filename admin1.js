const base = require('./db');

let db = new base.credentialMgr();


async function main(){
    await db.adminUpdateCredentialsForUser(2,'secret2');
    await db.closeDatabase();
}

main();