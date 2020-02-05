const mongoose = require('mongoose');
const Schema = mongoose.Schema; // alias 

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required: true,
        unique: 1,
        maxlength:100
    },
    description:{ 
        type:String,
        required: true,
        maxlength:1000
    },
    price:{ 
        type:Number,
        required: true,
        maxlength:255
    },
    brand:{ 
        //type:String,
        type: Schema.Types.ObjectId,
      //  type: moongoose.Schema.Types.ObjectId, /* use alias schema instead of mongoose.schema - brand is linked*/
        ref: 'Brand',
        required: true
    },
    shipping:{
        required: true,
        type: Boolean
    },
    available:{
        required: true,
        type: Boolean
    },
    wood:{
        //type: String,
        type: Schema.Types.ObjectId,
        ref: 'Wood',
        required: true
    },
    frets:{
        required: true,
        type: Number
    },
    sold: {
        type:Number,
        maxlength:100,
        default: 0
    },
    publish:{
        required: true,
        type: Boolean
    },
    images: {
        type:Array,
        default:[]
    }

},{timestamps:true});


const Product = mongoose.model('Product',productSchema)
module.exports = {Product}
