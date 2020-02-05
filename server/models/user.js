const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_I = 10;
require('dotenv').config();

/* create user mongoose schema */
const userSchema = mongoose.Schema({
    email:{  type:String,
             required: true,
             trim: true,
             unique: 1
    },
    password:{ type:String,
               required: true,
               minlength:3
    },
    name:{ type:String,
            required: true,
            maxlength:50
    },
    lastname:{ type:String,
            required: true,
            maxlength:50
    },
    cart:{ type:Array,
            default:[]
    },
    history:{type:Array,
              default:[]
    },
    role: {type:Number,
            default:0
    },
    token : {type:String
    }          
})

/* pre - means before so before save - see server.js */
userSchema.pre('save',function(next){
    var user = this; /* alias for this - no longer necessary in es6  can just use this to refere to user schema*/
    /* isModified checks if the value has changed*/
    if(user.isModified('password')){
    bcrypt.genSalt(SALT_I,function(err,salt){
        if(err) return next(err)
        /* else */
            bcrypt.hash(user.password,salt,function(err,hash){
            if(err) return next(err)
            /* else */
            user.password = hash;
            next();
        })
       })
    } else {
      next() /* no encryption if pw not changed */
    }

})

/* check if password is good - when logging in */
userSchema.methods.comparePassword = function(candidatePassword,cb) {
        bcrypt.compare(candidatePassword,this.password,function(err,isMatch){
            if(err) return cb(err)
            cb(null,isMatch)   
        })
}

/* generate token */
userSchema.methods.generateToken = function(cb){
    var user = this;
    var token = jwt.sign(user._id.toHexString(),process.env.SECRET)    
    user.token = token;
    user.save(function(err,user){
           if(err) return cb(err);
           cb(null,user);
    })
}

/* decrypt token and compare */
userSchema.statics.findByToken = function(token,cb){
    var user = this;
    /* decode returns user id and token*/
    jwt.verify(token,process.env.SECRET,function(err,decode){
            user.findOne({"_id":decode,"token":token},function(err,user){
               if(err) return cb(err);
               cb(null,user);     
            })
    })
}


const User = mongoose.model('User',userSchema)
module.exports = {User}
