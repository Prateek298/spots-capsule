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

//Download app
router.get("/download", (req, res) => {
	res.download("./public/androidApp.apk", "SpotsCapsule.apk", err => {
		if(err) {
			console.log(err);
			req.flash('error', "Something went wrong");
			return res.redirect('/sights');
		}
	});
});

//====================Forgot Password================================
router.get("/forgot", (req, res) => {
	res.render("user/forgotPass");
});

router.post("/forgot", (req, res, next) => {
	waterfall([
		function(done){
			crypto.randomBytes(20, (error, buf) => {
				let token = buf.toString('hex');
				done(error, token);
			});
		},
		async function (token, done) {
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
 				text: `You requested for your password for Spots Capsule to be reset.Click the following link to do so: https://${req.headers.host}/reset/${token}`	   
			};

			transporter.sendMail(mailOptions, (error, info) => {
				req.flash('success', `An email has been sent to ${user.email} with further instructions`);
				done(error, 'done');
			}); 
		}
	], function(error){
			if(error) return next(error);
			res.redirect("/forgot");
	});
});

router.get("/reset/:token", async (req, res) => {
	const { token } = req.params;
	const user = await User.findOne( {resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}} );
	if(!user) {
		req.flash('error', "Password reset token is invalid or has expired");
		return res.redirect("/forgot");
	}
	res.render("user/resetPass", { token });
});

router.post("/reset/:token", function(req, res){
	waterfall([
		async (done) => {
			const user = await User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}});
			if(!user){
				req.flash('error', "Password reset token is invalid or has expired");
				return res.redirect("back");
			}
			if(req.body.password === req.body.confirm) {
				user.setPassword(req.body.password, async (error) => {
					user.resetPasswordToken = undefined;
					user.resetPasswordExpires = undefined;
					await user.save();
					req.login(user, (error) => {
						req.flash('success', "Password changed");
						res.redirect('/sights');
						done(error, user);
					});
				});
			}
			else {
				req.flash('error', "Passwords do not match");
				res.redirect("back");
			}
		}
	]);
});

module.exports = router;