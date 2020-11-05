const Sight  = require("../models/sight"),
	  Review = require("../models/review"),
	  User   = require("../models/user");

const middleware = {};

//Checks if a user is in the session or not
middleware.checkLogin = function(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	req.flash('error', "Login first!")
	res.redirect("/login");
}

//Ensures profile of a user is edited or deleted by them only
middleware.checkUser = function(req, res, next) {
	User.findById(req.params.id, (err, user) => {
		if(err || !user) {
			req.flash('error', "You are not authorized to do that")
			return res.redirect('back');
		}
		if(user._id.equals(req.user._id)) {
			return next();
		}
		res.redirect('back');
	});
}

middleware.checkAdmin = function(req, res, next) {
	if(req.user.isAdmin) {
		return next();
	}
	req.flash('error', "You are not authorized to do that");
	res.redirect("/sights");
}

middleware.checkReviewOwnership = function(req, res, next) {
    Review.findById(req.params.rev_id, (err, review) => {
        if(err || !review){
			console.log(err);
            return res.redirect('back');
        }
        if((review.user.id.equals(req.user._id)) || req.user.isPermAdmin) {
            return next();
        } 
        req.flash("error", "You don't have permission to do that");
        res.redirect('back');
    });
};

middleware.checkReviewExistence = function (req, res, next) {
    Sight.findById(req.params.id).populate("reviews").exec((err, sight) => {
        if (err || !sight) {
			 console.log(err);
             req.flash("error", "Sight not found");
             return res.redirect('back');
        }
        // check if req.user._id exists in sight.reviews
        let foundUserReview = sight.reviews.some((review) => {
            return review.user.id.equals(req.user._id);
        });
        if (foundUserReview) {
            req.flash("error", "You already wrote a review");
            return res.redirect("/sights/" + sight._id);
        }
        next();
    });
};

module.exports = middleware;