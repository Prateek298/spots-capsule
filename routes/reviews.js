 const express = require('express'),
	  router  = express.Router({ mergeParams: true });

const Review = require("../models/review"),
	  Sight  = require("../models/sight"),
	  middleware = require("../middleware");

//INDEX
router.get("/", (req, res) => { 
	let sortCategory = (req.query.sortBy == 'ratings')? {rating: -1} : {createdAt: -1};
	Sight.findById(req.params.id).populate({
		path: 'reviews',
		options: {sort: sortCategory} 
	}).exec( (err, sight) => {
		if(err || !sight) {
			req.flash('error', "Sight couldn't be found");
			return res.redirect("back");
		}
		res.render("reviews/index", {sight});
	});
});

//NEW
router.get("/new", middleware.checkLogin, middleware.checkReviewExistence, (req, res) => {
    // middleware.checkReviewExistence checks if a user already reviewed the sight, only one review per user is allowed
    Sight.findById(req.params.id, function (err, sight) {
        if (err) {
            req.flash('error', "Sight couldn't be found");
            return res.redirect("back");
        }
        res.render("reviews/new", {sight});
    });
});

//CREATE
router.post("/", middleware.checkLogin, middleware.checkReviewExistence, (req, res) => {
	Sight.findById(req.params.id).populate('reviews').exec((err, sight) => {
		if(err) {
			req.flash('error', "Sight couldn't be found");
			return res.redirect("back");
		}
		Review.create(req.body.review, (err, review) => {
			if(err) {
				console.log(err);
				return res.redirect("back");
			}
			//Saving new review
			review.user.id = req.user._id;
			review.user.username= req.user.username;
			review.sight = sight;
			review.save();
			//Updating the sight
			sight.reviews.push(review);
			sight.rating = calculateAverage(sight.reviews);
			sight.save();
			
			req.flash('success', "Review added");
			res.redirect("/sights/" + req.params.id);
		});
	});
});

//EDIT
router.get("/:rev_id/edit", middleware.checkLogin, middleware.checkReviewOwnership, (req, res) => {
	Review.findById(req.params.rev_id, function (err, review) {
        if (err) {
            req.flash('error', "Sight couldn't be found");
            return res.redirect("back");
        }
        res.render("reviews/edit", {sightId: req.params.id, review: review});
    });
});

//UPDATE
router.put("/:rev_id", middleware.checkLogin, middleware.checkReviewOwnership, (req, res) => {
    Review.findByIdAndUpdate(req.params.rev_id, req.body.review, {new: true}, (err) => {
        if (err) {
            req.flash("error", err.message);
			console.log(err);
            return res.redirect("back");
        }
        Sight.findById(req.params.id).populate("reviews").exec( (err, sight) => {
            if (err) {
                req.flash("error", err.message);
				console.log(err);
                return res.redirect("back");
			}
            // recalculate campground average
            sight.rating = calculateAverage(sight.reviews);
            sight.save();
			
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/sights/' + req.params.id);
        });
    });
});

//DESTROY
router.delete("/:rev_id", middleware.checkLogin, middleware.checkReviewOwnership, (req, res) => {
    Review.findByIdAndRemove(req.params.rev_id, (err) => {
        if (err) {
            req.flash("error", err.message);
			console.log(err);
            return res.redirect("back");
        }
        Sight.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.rev_id}}, {new: true}).populate("reviews").exec((err, sight) => {
            if (err) {
                req.flash("error", err.message);
				console.log(err);
                return res.redirect("back");
            }
            // recalculate campground average
            sight.rating = calculateAverage(sight.reviews);
            sight.save();
			
            req.flash("success", "Your review was deleted successfully.");
			console.log(err);
            res.redirect("/sights/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    let sum = 0;
    reviews.forEach((element) => { sum += element.rating });
    return sum / reviews.length;
}

module.exports = router;