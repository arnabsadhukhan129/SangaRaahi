/**************** ************
 Pagename : fcm service
 Author :
 CreatedDate : 19.10.2022

 Purpose : Fcm specific service
 *****************************/
 const firebase_admin = require("firebase-admin");
 const serviceAccount = require("../config/sangaraahi-firebase-adminsdk-s8034-55cd459d3a.json");
 
 const fcmApp = firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(serviceAccount)
 });
 
 module.exports = fcmApp