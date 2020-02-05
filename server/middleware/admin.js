
/* check if user is trying to post a new brand needs to be admin role = 1 */
let admin = (req,res,next) =>{
  if(req.user.role === 0){
      return res.send('no permission to add brands')
  }
  next()
}

module.exports = {admin}