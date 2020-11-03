const express        = require('express'),
	  router         = express.Router(),
	  passport       = require('passport'),
	  multer         = require('multer'),
	  { storage }    = require('../configs/cloudinary'),
	  upload         = multer({ storage }),
	  { cloudinary } = require('../configs/cloudinary');

const User = require("../models/user"),
	  middleware = require("../middleware");

//NEW
router.get("/new", (req, res) => {
	res.render("user/register");
});

//CREATE
router.post("/", upload.single('image'), (req, res) => {
	const newUser = new User({
		username: req.body.username,
		email: req.body.email,
		age: req.body.age,
		about: req.body.about
	});
	if(ValidateEmail(newUser.email)) {
		User.register(newUser, req.body.password, async (err, user) => {
			if(err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			if(req.file) {
				user.profilePic.url = req.file.path; 
				user.profilePic.filename = req.file.filename;
				await user.save();
			}
			passport.authenticate('local')(req, res, () => {
				req.flash('success', `Welcome,${req.user.username}`);
				res.redirect("/sights");
			});
		});
	}
	else {
		res.redirect('back');
	}
});

//SHOW
router.get("/:id", (req, res) => {
	User.findById(req.params.id, (err, foundUser) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect("back");
		}
		res.render("user/profile", { user: foundUser });
	});
});

//EDIT
router.get("/:id/edit", middleware.checkUser, (req, res) => {
	User.findById(req.params.id, (err, foundUser) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect('back');
		}
		res.render("user/edit", { user: foundUser });
	});
});

//UPDATE
router.put("/:id", middleware.checkUser, upload.single('image'), (req, res) => {
	User.findByIdAndUpdate(req.params.id, req.body.user, async (err, user) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect("/users/" + req.params.id);
		}
		if(req.file) {
			if(user.profilePic) {
				cloudinary.uploader.destroy(user.profilePic.filename);
			}
			user.profilePic.url = req.file.path; 
			user.profilePic.filename = req.file.filename;
			await user.save();
		}
		req.flash('success', "Profile updated");
		res.redirect("/users/" + req.params.id);
	});
});

//PATCH - for altering admin roles
router.patch("/:id", middleware.checkLogin, middleware.checkAdmin, (req, res) => {
	User.findById(req.params.id, (err, user) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect("/users");
		}
		let msg = `${user.username} is now an admin`;
		if(!user.isPermAdmin) {
			user.isAdmin = (user.isAdmin) ? false : true;
			user.save();
			if(!user.isAdmin) {
				msg = `${user.username} is no longer an admin`;
			}
			req.flash('success', msg);
		}
		else {
			msg = `${user.username} cannot be removed as admin`;
			req.flash('error', msg);
		}
		
		res.redirect("/users");
	});
});

//DESTROY
router.delete("/:id", middleware.checkUser, (req, res) => {
	User.findById(req.params.id, async (err, user) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect("/users/" + req.params.id);
		}
		if(user.profilePic) {
			cloudinary.uploader.destroy(user.profilePic.filename);
		}
		await user.deleteOne();
		req.flash('success', "We bid you farewell");
		res.redirect("/sights");
	});
});

//INDEX - Admin only access
router.get("/", middleware.checkLogin, middleware.checkAdmin, (req, res) => {
	User.find({}, (err, users) => {
		if(err) {
			req.flash('error', "Some error occured");
			return res.redirect('back');
		}
		res.render("user/index", {users});
	});
});

//Validating email syntax 
function ValidateEmail(email)
{
	const mailformat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	if(mailformat.test(email))
	{
		return true;
	}
	return false;
}

module.exports = router;