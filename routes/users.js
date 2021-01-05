const express        = require('express'),
	  router         = express.Router(),
	  passport       = require('passport'),
	  multer         = require('multer'),
	  { storage }    = require('../configs/cloudinary'),
	  upload         = multer({ storage }),
	  { cloudinary } = require('../configs/cloudinary');

const User = require("../models/user");
const { checkLogin, checkUser, checkAdmin } = require("../middleware");

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
			else {
				user.profilePic.url = "https://res.cloudinary.com/prat/image/upload/v1604423713/Sights/default_user_yg2epc.jpg";
				await user.save();
			}
			passport.authenticate('local')(req, res, () => {
				req.flash('success', `Welcome, ${req.user.username} in the Capsule`);
				res.redirect("/sights");
			});
		});
	}
	else {
		res.redirect('back');
	}
});

//SHOW
router.get("/:id", async (req, res) => {
	const user = await User.findById(req.params.id);
	if(!user) {
		req.flash('error', "User not found");
		return res.redirect("back");
	}
	res.render("user/profile", { user });
});

//EDIT
router.get("/:id/edit", checkUser, async (req, res) => {
	const user = await User.findById(req.params.id);
	if (!user) {
		req.flash('error', "User not found");
		return res.redirect('back');
	}
	res.render("user/edit", { user });
});

//UPDATE
router.put("/:id", checkUser, upload.single('image'), async (req, res) => {
	const { id } = req.params;
	const user = await User.findByIdAndUpdate(id, req.body.user, { new: true });
	if(!user) {
		req.flash('error', "User not found");
		return res.redirect(`/users/${id}`);
	}
	if(req.file) {
		if(user.profilePic) {
			cloudinary.uploader.destroy(user.profilePic.filename);
		}
		user.profilePic.url = req.file.path; 
		user.profilePic.filename = req.file.filename;
		await user.save();
	}
	// res.render('user/profile', { user });
	res.redirect(`/users/${id}`); //-- weird issue: _id undefined 
});

//PATCH - for altering admin roles
router.patch("/:id", checkLogin, checkAdmin, async (req, res) => {
	const user = await User.findById(req.params.id);
	if(!user) {
		req.flash('error', "User not found");
		return res.redirect("/users");
	}
	let msg = `${user.username} is now an admin`;
	if(!user.isPermAdmin) {
		user.isAdmin = (user.isAdmin) ? false : true;
		await user.save();
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

//DESTROY
router.delete("/:id", checkUser, async (req, res) => {
	const user = await User.findById(req.params.id);
	if(!user) {
		req.flash('error', "User not found");
		return res.redirect(`/users/${req.params.id}`);
	}
	if(user.profilePic && user.profilePic.filename) {
		cloudinary.uploader.destroy(user.profilePic.filename);
	}
	await user.deleteOne();
	req.flash('success', "We bid you farewell");
	res.redirect("/sights");
});

//INDEX - Admin only access
router.get("/", checkLogin, checkAdmin, async (req, res) => {
	const users = await User.find({});
	if(!users.length) {
		req.flash('error', "No users present");
		return res.redirect('back');
	}
	res.render("user/index", {users});
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