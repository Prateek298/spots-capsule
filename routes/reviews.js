const express = require('express');
const router  = express.Router({ mergeParams: true });

const Review = require("../models/review");
const Sight  = require("../models/sight");
const { checkLogin, checkReviewExistence, checkReviewOwnership } = require("../middleware");

//INDEX
router.get("/", async (req, res) => { 
	let sortCategory = (req.query.sortBy == 'ratings')? {rating: -1} : {createdAt: -1};
	const sight = await Sight.findById(req.params.id).populate({
		path: 'reviews',
		options: {sort: sortCategory} 
	});
    if(!sight) {
        req.flash('error', "Sight couldn't be found");
        return res.redirect("back");
    }
    res.render("reviews/index", { sight, sortCategory: req.query.sortBy });
});

//NEW
router.get("/new", checkLogin, checkReviewExistence, async (req, res) => {
    // middleware.checkReviewExistence checks if a user already reviewed the sight, only one review per user is allowed
    const sight = await Sight.findById(req.params.id);
    if (!sight) {
        req.flash('error', "Sight couldn't be found");
        return res.redirect("back");
    }
    res.render("reviews/new", { sight });
});

//CREATE
router.post("/", checkLogin, checkReviewExistence, async (req, res) => {
    const sight = await Sight.findById(req.params.id).populate('reviews');
    const review = await Review.create(req.body.review);
    if(!sight || !review) {
        req.flash('error', "Incorrect sight or review");
        return res.redirect('back');
    }
    //Saving new review
    review.user.id = req.user._id;
    review.user.username= req.user.username;
    review.sight = sight;
    await review.save();
    //Updating the sight
    sight.reviews.push(review);
    sight.rating = calculateAverage(sight.reviews);
    await sight.save();
        
    req.flash('success', "Review added");
    res.redirect(`/sights/${req.params.id}`);
});

//EDIT
router.get("/:rev_id/edit", checkLogin, checkReviewOwnership, async (req, res) => {
    const review = await Review.findById(req.params.rev_id);
    if(!review) {
        req.flash('error', "Requested review cannot be found");
        return res.redirect('back');
    }
    res.render("reviews/edit", {sightId: req.params.id, review});
});

//UPDATE
router.put("/:rev_id", checkLogin, checkReviewOwnership, async (req, res) => {
    const { id, rev_id } = req.params;
    const review = await Review.findByIdAndUpdate(rev_id, req.body.review, {new: true});
    if (!review) {
        req.flash('error', "Review to be updated can't be found");
        return res.redirect("back");
    }
    const sight = await Sight.findById(id).populate("reviews");
    if (!sight) {
        req.flash('error', "Related sight isn't available");
        return res.redirect("back");
    }
    // recalculate campground average
    sight.rating = calculateAverage(sight.reviews);
    await sight.save();
    
    req.flash('success', "Your review was successfully edited");
    res.redirect(`/sights/${id}`);
});

//DESTROY
router.delete("/:rev_id", checkLogin, checkReviewOwnership, async (req, res) => {
    const review = await Review.findByIdAndRemove(req.params.rev_id);
    if (!review) {
        req.flash('error', "Review to be deleted can't be found");
        return res.redirect("back");
    }
    const sight = await Sight.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.rev_id}}, {new: true}).populate("reviews");
    if (!sight) {
        req.flash('error', "Related sight isn't available");
        return res.redirect("back");
    }
    // recalculate campground average
    sight.rating = calculateAverage(sight.reviews);
    await sight.save();
    
    req.flash("success", "Your review was deleted successfully.");
    res.redirect(`/sights/${req.params.id}`);
});

const calculateAverage = reviews => 
(reviews.length === 0)? 0 : reviews.reduce((accumulator, review) => accumulator + review.rating , 0)/reviews.length;

module.exports = router;