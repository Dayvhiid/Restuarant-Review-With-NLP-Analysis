import mongoose from 'mongoose';    
const restaurantSchema  = new mongoose.Schema({
    name: {
        type: String,
        required:true,
    },
    location: {
        type: String,
        required: false
    },
    cuisine : {
        type:String,
        required: true,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

export default mongoose.model('Restaurant', restaurantSchema);