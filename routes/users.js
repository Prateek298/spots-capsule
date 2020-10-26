const express    = require('express'),
	  router     = express.Router(),
	  passport   = require('passport'),
	  multer     = require('multer'),
	  cloudinary = require('cloudinary');

const User = require("../models/user"),
	  middleware = require("../middleware");

//multer config for image upload
let storage = multer.diskStorage({
	filename: function(req, file, cb) {           //cb - callback
		cb(null, Date.now() + file.orginalname);  //changing file names to be unique
	}
});

const imageFilter = function(req, file, cb) {
	// accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
}

const upload = multer({ storage: storage, fileFilter: imageFilter});

//Cloudinary config
cloudinary.config({
	cloud_name: "prat",
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

//NEW
router.get("/new", (req, res) => {
	res.render("user/register");
});

//CREATE
router.post("/", (req, res) => {
	const newUser = new User({
		username: req.body.username,
		email: req.body.email,
		profilePic: req.body.pic,
		age: req.body.age,
		about: req.body.about
	});
	User.register(newUser, req.body.password, (err, user) => {
		if(err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		passport.authenticate('local')(req, res, () => {
			req.flash('success', "Welcome " + req.user.username);
			res.redirect("/sights");
		});
	});
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
router.put("/:id", middleware.checkUser, (req, res) => {
	User.findByIdAndUpdate(req.params.id, req.body.user, (err, foundUser) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect("/users/" + req.params.id);
		}
		req.flash('success', "Profile updated");
		res.redirect("/users/" + req.params.id);
	});
});

//PATCH
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
	User.findByIdAndRemove(req.params.id, (err) => {
		if(err) {
			req.flash('error', "User not found");
			return res.redirect("/users/" + req.params.id);
		}
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

module.exports = router;