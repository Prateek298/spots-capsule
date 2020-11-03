const express    = require('express'),
	  router     = express.Router(),
	  passport   = require('passport'),
	  nodemailer = require('nodemailer'),
	  waterfall  = require('async-waterfall'),
	  crypto     = require('crypto');

const User = require("../models/user");

//Landing route
router.get("/", (req, res) => {
	res.render("landing");
});

//About
router.get("/about", (req, res) => {
	res.render('about');
});

//====================Forgot Password================================
router.get("/forgot", (req, res) => {
	res.render("user/forgotPass");
});

router.post("/forgot", (req, res, next) => {
	waterfall([
		function(done){
			crypto.randomBytes(20, (error, buf) => {
				var token = buf.toString('hex');
				done(error, token);
			});
		},
		function(token, done){
			User.findOne({email: req.body.email}, (error, user) => {
				if(!user){
					req.flash('error', "No email account with that email address exists");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000;
				user.save((error) => {
					done(error, token, user);
				});
			});
		},
		function(token, user, done){
			let transporter = nodemailer.createTransport({
				host: 'smtp.gmail.com',
				port: 587,
				secure: false,
				requireTLS: true,
				auth: {
					// type: "OAuth2",
    				user: process.env.GMAILID, // like : abc@gmail.com
    				pass: process.env.GMAILPW  // like : pass@123
				}
			});

			let mailOptions = {
 				from: 'prateeksingh298@gmail.com',
 				to: req.body.email,
 				subject: 'Spots Capsule',
 				text: 'You requested for your password for Spots Capsule to be reset.Click the following link to do so: ' + 'https://' + req.headers.host + '/reset/' + token	   
			};

			transporter.sendMail(mailOptions, (error, info) => {
				console.log('success');
				req.flash('success', "An email has been sent to " + user.email + " with further instructions");
				done(error, 'done');
			}); 
		}
	], function(error){
			if(error) return next(error);
			res.redirect("/forgot");
	});
});

router.get("/reset/:token", function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (error, user) => {
		if(!user){
			req.flash('error', "Password reset token is invalid or has expired");
			return res.redirect("/forgot");
		}
		res.render("user/resetPass", {token: req.params.token});
	});
});

router.post("/reset/:token", function(req, res){
	waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (error, user) => {
				if(!user){
					req.flash('error', "Password reset token is invalid or has expired");
					return res.redirect("back");
				}
				if(req.body.password === req.body.confirm){
					user.setPassword(req.body.password, (error) => {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						user.save((error) => {
							req.logIn(user, (error) => {
								done(error, user);
							});
						});
					});
				}
				else {
					req.flash('error', "Passwords do not match");
					res.redirect("back");
				}
			});
		}
	]);
});

module.exports = router;