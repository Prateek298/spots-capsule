const mongoose              = require('mongoose'),
	  passportLocalMongoose = require('passport-local-mongoose');

const defaultPic = "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-social-media-user-vector-default-avatar-profile-icon-social-media-user-vector-portrait-176194876.jpg";

const userSchema = new mongoose.Schema({
	//compulsory
	username: {type: String, unique: true, required: true},
	password: String,
	email: {type: String, unique: true, required: true},
	//optional
	age: Number,
	profilePic: {
		url: String,
    	filename: String
	},
	profilePicId: String,
	about: String,
	isAdmin: {type: Boolean, default: false},
	isPermAdmin: {type: Boolean, default: false},
	//password reset
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);