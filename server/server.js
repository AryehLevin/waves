const express = require('express');
const bodyParser = require('body-parser'); /* parsers data from json */
const cookiesParser = require('cookie-parser');
const formidable = require('express-formidable') // for uploading files
const cloudinary = require('cloudinary')
let async = require('async'); // allows for multiple call backs
const app = express(); /* create an express app  server */


const mongoose = require('mongoose'); /* the database sever */
mongoose.set('useFindAndModify', false); // finoneandupdate depreciated
require('dotenv').config(); /* can only import .env if use dotenv library */

//===============================
// setup the mongoose db 
//===============================
mongoose.Promise = global.Promise
mongoose.connect(process.env.DATABASE,{ useNewUrlParser: true,useUnifiedTopology: true}) /*use alias that sits in .env file */
// mongoose.connect(`process.env.DATABASE ${user} ${password} @${server}/${database})
//===============================
// MIDDLE WARE 
//===============================
app.use(bodyParser.urlencoded({extended:true}))  
app.use(bodyParser.json()) /* converts data to json - under req.body*/
app.use(cookiesParser())

// set up proxy
app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
 
    next();
});

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
})


//===============================
// MODELS
//===============================
const {User} = require('./models/user') /* import the schema file from models */
const {Brand} = require('./models/brand') /* import the schema file from models */
const {Wood} = require('./models/wood') /* import the schema file from models */
const {Product} = require('./models/product') /* import the schema file from models */
const {Payment} = require('./models/payment') /* import the schema file from models */
const {Site}    = require('./models/site')

/* Middleware */
const {auth} = require('./middleware/auth');
const {admin} = require('./middleware/admin');


//===============================
// PRODUCTS
//===============================
/*note: use post as sending in json data - also use body and not query */
app.post('/api/product/shop',(req,res)=>{
    let order  = req.body.order  ? req.body.order : 'asc' /* comes from bodyParser.urlencoded */
    let sortBy = req.body.sortBy ? req.body.sortBy : '_id' /* comes from bodyParser.urlencoded */
    let limit  = req.body.limit  ? parseInt(req.body.limit) : 100 /* convert it to int */
    let skip   = req.body.skip   ? parseInt(req.body.skip) : 0 /* convert it to int */
    let findArgs = {}
    
    
    for (let key in req.body.filters){
        if(req.body.filters[key].length > 0){
           if(key === 'price') {
               findArgs[key] = {
                $gte: req.body.filters[key][0],
                $lte: req.body.filters[key][1]
               }
           }else {
              findArgs[key] = req.body.filters[key] 
           }
        }
    }
    findArgs['publish'] = true // add extra condition 

    Product.find(findArgs).
    populate('brand').populate('wood').
    sort([[sortBy,order]]).
    skip(skip).
    limit(limit).
    exec((err,articles)=>{
         if(err) return res.status(400).send(err);
         else {
              //console.log("products shop",articles)
              return res.status(200).json({size:articles.length,articles})
         }
         
    })
    
})

// by arrival (sortby=createdAt&order=desc&limit=4)
app.get('/api/product/articles',(req,res)=>{
    let order  = req.query.order ?req.query.order : 'asc' /* comes from bodyParser.urlencoded */
    let sortBy = req.query.sortBy ?req.query.sortBy : '_id' /* comes from bodyParser.urlencoded */
    let limit  = req.query.limit ? parseInt(req.query.limit) : 100 /* convert it to int */
    
    Product.find().
        populate('brand').populate('wood').
        sort([[sortBy,order]]).
        limit(limit).
        exec((err,articles)=>{
             if(err) return res.status(400).send(err);
              res.send(articles)
        })
})

// by no sold (sortby=sold&order=desc&limit=4)


// by id or an array of ids
app.get('/api/product/article_by_id',(req,res)=>{
 let type = req.query.type; /* comes from bodyParser.urlencoded */
 let items = req.query.id;
 if(type==="array"){
   // console.log('array in ',type)
     let ids = req.query.id.split(',');
     items = []
     items = ids.map(item=>{
        return mongoose.Types.ObjectId(item)
     })
 }
 Product.find({'_id':{$in:items}}).
     populate('brand').populate('wood').
     exec((err,docs)=>{
     return res.status(200).send(docs);
 })

})



/* below chaninng middlewares auth and then admin*/
app.post('/api/product/article',auth,admin,(req,res)=>{
    const product = new Product(req.body);
    // console.log('error',req.body)
   
    // get back an error or a document from mongodb
    product.save((err,doc)=>{
      //  console.log('doc',doc)
        if(err) return res.json({success:false,err})
        else 
            return res.status(200).json({
                   success:true,
                   article:doc
            })
    })
})


//===============================
// WOODS
//===============================

/* below chaninng middle wares auth and then admin*/
app.post('/api/product/wood',auth,admin,(req,res)=>{
    const wood = new Wood(req.body);
   
    // get back an error or a document from mongodb
    wood.save((err,doc)=>{
        if(err) return res.json({success:false,err})
        res.status(200).json({
            success:true,
            wood:doc
        })
    })
})

/* this is to get all the wood */
app.get('/api/product/woods',(req,res)=>{
   Wood.find({},(err,woods)=>{
      if(err) return res.status(400).send(err);
      res.status(200).send(woods)
   }) 
})


//===============================
// BRAND
//===============================
/* below chaninng middle wares auth and then admin*/
app.post('/api/product/brand',auth,admin,(req,res)=>{
    const brand = new Brand(req.body);
   
    // get back an error or a document from mongodb
    brand.save((err,doc)=>{
        if(err) return res.json({success:false,err})
        else res.status(200).json({
            success:true,
            brand:doc
        })
    })
})
/* this is to get all the brands */
app.get('/api/product/brands',(req,res)=>{
   Brand.find({},(err,brands)=>{
      if(err) return res.status(400).send(err);
      res.status(200).send(brands)
   }) 
})

//===============================
// USERS
//===============================

/* authenticate the user */
app.get('/api/users/auth',auth,(req,res)=>{
   res.status(200).json({
       //user: req.user
       isAdmin:req.user.role === 0 ? false : true,
       isAuth:true,
       email: req.user.email,
       name:req.user.name,
       lastname: req.user.lastname,
       role: req.user.role,
       cart: req.user.cart,
       history: req.user.history
   })
})

/* to register a user */
app.post('/api/users/register',(req,res)=>{
   // res.status(200)
   const user = new User(req.body);

   user.save((err,doc)=>{
       // note : in user presave is called to hash the password
       if(err) return res.json({success:false,err})
       res.status(200).json({
           success: true,
           userdata: doc
       })
   })
})

/* user login */
app.post('/api/users/login',(req,res)=>{
    // find email
    User.findOne({'email':req.body.email},(err,user)=>{
        if(!user) return res.json({loginSuccess:false,message:'Login Failed, email not found'})
         // check password
        user.comparePassword(req.body.password,(err,isMatch)=>{
            if(!isMatch) return res.json({loginSuccess:false,message:'wrong password'})
            // generate a token
            user.generateToken((err,user)=>{
                if(err) return res.status(400).send(err);
                   res.cookie('w_auth',user.token).status(200).json({
                       loginSuccess:true,
                       userdata: user
                  }) 
            })
        })
    })     
})

/* upload image */

//app.post('/api/users/uploadimage',admin,auth,formidable(),(req,res)=>{
   // res.status(200).send({public_id: result.public_id, use:result.url})
   
app.post('/api/users/uploadimage',auth,formidable(),(req,res)=>{
    cloudinary.uploader.upload(req.files.file.path,
                               (result)=> {
                                 console.log('file upload result',result)
                                 res.status(200).send({public_id: result.public_id, use:result.url})
                                },
                               {public_id:`${Date.now()}`,resource_type:'auto'}
                             )

   
})
app.get('/api/users/removeimage',auth,admin,(req,res)=>{
  let image_id = req.query.public_id
  cloudinary.uploader.destroy(image_id,(error,result)=>{
   if(error) 
     return res.json({success:false})
   else 
     return res.status(200).send('ok')
  })
})

/* logout */
app.get('/api/users/logout',auth,(req,res) =>{
    User.findOneAndUpdate(
        {_id:req.user._id},
        {token:''},
        (err,doc)=>{
            if(err) return res.json({success:false,err});
            return res.status(200).send({
                success:true
            })
        }
    )
})

 /* update profile */
 app.post('/api/users/update_profile',auth,(req,res) =>{
    User.findOneAndUpdate(
        {_id:req.user._id}, // this comes from the auth
        {"$set": req.body},  // has in it name, lastname and email
        {new:true},
        (err,doc)=>{
            if(err) return res.json({success:false,err});
            return res.status(200).send({
                success:true
            })
        })
})

/* add to cart */
app.post('/api/users/addToCart',auth,(req,res) =>{
    //console.log('server cart 1',req.query.productId,req.user._id)
    User.findOne ({_id:req.user._id},(err,doc)=>{
        let duplicate = false
        doc.cart.forEach((item)=>{
            if(item.id == req.query.productId){
                duplicate = true
            }
        })
        //console.log('server cart 2',duplicate)
        if(duplicate) {
            User.findOneAndUpdate(
                {id:req.user._id,"cart.id":mongoose.Types.ObjectId(req.query.productId) }, 
                {$inc: {"cart.quantity":1}} ,
                {new:true},
                () => {
                    if(err) 
                        return res.json({success:false,err}) 
                    else {   
                        //console.log('server cart dup',doc.cart)
                        res.status(200).json(doc.cart)   }    
                    }
            )
        } else {
            User.findOneAndUpdate(
                    {_id: req.user._id},
                    { $push: {cart:{
                        id: mongoose.Types.ObjectId(req.query.productId),
                        quantity:1,
                        date: Date.now()
                    }}},
                    {new: true},
                    (err,doc) => {
                        if(err) 
                            return res.json({success:false,err}) 
                        else {   
                            console.log('server cart',doc.cart)
                            res.status(200).json(doc.cart)                     }    
                        }
            )
        }
    })
 })
 
 /* remove from cart */
app.get('/api/users/removeFromCart',auth,(req,res) =>{
    User.findOneAndUpdate(
        {_id:req.user._id},
        {"$pull":{"cart": {"id":mongoose.Types.ObjectId(req.query._id)}} }, 
        {new:true},
        (err,doc)=>{
             let cart = doc.cart;
             let array = cart.map(item=>{
                return mongoose.Types.ObjectId(item.id)
             })
            Product.find({'_id':{$in:array} }).
            populate('brand').populate('wood').
            exec((err,cartDetail)=>{
               return res.status(200).json({
                   cartDetail,
                   cart
               })
            })
        })
})

/* successful purchase */
 app.post('/api/users/successBuy',auth,(req,res) =>{

    //console.log('got to successbuy',req.body)
    // user history
    let history = []
    let transactionData = {}

    req.body.cartDetail.forEach((item)=>{
       history.push({
           dataofPurchase: Date.now(),
           name:      item.name,
           brand:     item.brand.name,
           id:        item._id,
           price:     item.price,
           quantity:  item.quantity,
           paymentId: req.body.paymentData.paymentID
       })
    })

    // transaction data
    transactionData.user = {
        id:       req.user._id,
        name:     req.user.name,
        lastname: req.user.lastname,
        email:    req.user.email 
    }
    transactionData.data = req.body.paymentData
    transactionData.product = history
           
    User.findOneAndUpdate(
        {_id:req.user._id},
        {$push:{history:history}, $set:{cart:[] } },
        {new:true},  // gets the updated document
        (err,user)=>{
            if(err) return res.json({success:false,err});
            //else
               console.log('no payment',transactionData)
               const payment = new Payment(transactionData)
               payment.save((err,doc)=>{
                 if(err) 
                      { console.log('error',err)
                        return res.json({success:false,err});
                 }
                   // create array of all products updated - its in doc  
                   let product =[]
                   doc.product.forEach(item=>{
                       product.push({id:item.id,quantity:item.quantity })
                   })
                   console.log('products',product)
                   async.eachSeries(
                      product, // array of data to be updated
                      // update
                      (item,callback)=>{ 
                            Product.update({_id:item.id,$inc:{"sold":item.quantity}},
                                           {new:false}
                            )}, 
                         // callback after all is finished           
                      (err)=>{if(err) 
                                return res.json({success:false,err}); 
                              res.status(200).json({success:true, cart: user.cart, cartDetail:[]})
                             }  
                   )

               })
            
            return res.status(200).send({
                success:true
            })
        }
    ) 
}) 
//===============================
// SITE
//===============================
/* get site data -only 1 record */
app.get('/api/site/site_data',(req,res) =>{
   
    Site.find({},
        (err,site)=>{
            if(err) return res.status(400).send(err);
            else {
               // console.log('site got here',site[0].siteInfo)
                return res.status(200).send(site[0].siteInfo)
            }
       
        }
    )
})

/* get site data -only 1 record */
app.post('/api/site/site_data',auth,admin,(req,res) =>{   
    Site.findOneAndUpdate({name:"site"},
       {"$set":{siteInfo:req.body}} ,
       {new:true},
        (err,site)=>{
            if(err) return res.json({success:false,err});
            else {
                console.log('site got here',site)
                return res.status(200).send({
                    success: true,  
                    siteInfo: site.siteInfo
                })
            }
       
        }
    )
})




/* listerns to a port */
const port = process.env.PORT || 3002;
app.listen(port,()=>{
    console.log(`Server running at ${port}`)
})