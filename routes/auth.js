const express  = require('express'),
	  router   = express.Router(),
	  passport = require('passport');

router.get("/login", (req, res) => {
	res.render("user/login");
});

router.post("/login", passport.authenticate('local', {
	successRedirect: "/sights",
	failureRedirect: "/login",
	failureFlash: true,
	successFlash: "Welcome back!"
}), (req, res) => {
	
});

router.get("/logout", (req, res) => {
	req.logout();
	req.flash('success', "See you soon, bye");
	res.redirect("/sights");
});

module.exports = router;