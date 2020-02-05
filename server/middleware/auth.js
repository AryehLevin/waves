const {User} = require('./../models/user') /* import the schema file from models */

/* check if user is authenticated */
let auth = (req,res,next) => {
   let token = req.cookies.w_auth;

   User.findByToken(token,(err,user)=>{
       if(err) throw err;
       //if(err) return err;
       if(!user) 
          return res.json({isAuth:false,error:true });
       else {
          req.token = token;
          req.user = user;
          next();
       }
   })

}

module.exports = {auth}