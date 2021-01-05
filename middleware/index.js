const Sight  = require("../models/sight"),
	  Review = require("../models/review"),
	  User   = require("../models/user");

//Checks if a user is in the session or not
module.exports.checkLogin = (req, res, next) => {
	if(req.isAuthenticated()) {
		return next();
	}
	req.flash('error', "Login first!")
	res.redirect("/login");
}

//Ensures profile of a user is edited or deleted by them only
module.exports.checkUser = async (req, res, next) =>  {
    const user = await User.findById(req.params.id);
    if(!user) {
        req.flash('error', "No such user found");
        return res.redirect('back');
    }
    if(user._id.equals(req.user._id)) {
        return next();
    } 
    req.flash('error', "You are not authorized to do that");
    res.redirect('back');
}

module.exports.checkAdmin = (req, res, next) => {
	if(req.user.isAdmin) {
		return next();
	}
	req.flash('error', "You are not authorized to do that");
	res.redirect("/sights");
}

module.exports.checkReviewOwnership = async (req, res, next) => {
    const review = await Review.findById(req.params.rev_id);
    if(!review) {
        req.flash('error', "Review couldn't be found");
        return res.redirect('back');
    }
    if((review.user.id.equals(req.user._id)) || req.user.isPermAdmin) {
        return next();
    }
    req.flash("error", "You don't have permission to do that");
    res.redirect('back');
}

module.exports.checkReviewExistence = async (req, res, next) => {
    const sight = await Sight.findById(req.params.id).populate("reviews");
    if (!sight) {
        req.flash("error", "Sight not found");
        return res.redirect('back');
    }
    // check if req.user._id exists in sight.reviews
    let foundUserReview = sight.reviews.some(review => review.user.id.equals(req.user._id));
    if (foundUserReview) {
        req.flash("error", "You already wrote a review");
        return res.redirect(`/sights/${sight._id}`);
    }
    next();
}