
import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    resetPasswordOTP: {type: String},
    resetPasswordExpires: {type: Date}

},{timestamps:true});

export default mongoose.models.User || mongoose.model("User", UserSchema);