const express        = require('express'),
	  router         = express.Router(),
	  multer         = require('multer'),
	  { storage }    = require('../configs/cloudinary'),
	  upload         = multer({ storage }),
	  { cloudinary } = require('../configs/cloudinary'),
	  mbxGeocoding   = require('@mapbox/mapbox-sdk/services/geocoding');

const geocoder = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

const Sight = require("../models/sight"),
	  Review = require("../models/review"),
	  middleware = require("../middleware");

//INDEX
router.get("/", async (req, res) => {
	const perPage = 6;
	let pageQuery = parseInt(req.query.page);
    let pageNumber = pageQuery ? pageQuery : 1;
	let noMatch = null;
	let obj;
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		obj = await searchBy({placeName: regex}, perPage, pageNumber);
		if(obj.sightCount === 0) {
			obj = await searchBy({location: regex}, perPage, pageNumber);
		}
		if(obj.sightCount === 0) {
			req.flash('error', "No matching documents found");
			return res.redirect('/sights');
		}
    	else if (obj.error) {
            req.flash('error', 'Sorry, Something went wrong');
            return res.redirect('/sights');
    	}
		res.render("sights/index", {
            sights: obj.foundSights,
            current: pageNumber,
            pages: Math.ceil(obj.sightCount / perPage),
            noMatch: noMatch,
            search: req.query.search
    	});
	}
	else {
		Sight.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec((err, sights) => {
			if(err) {
				console.log(err);
			}
			else {
				Sight.countDocuments({}, (err, count) => {
					res.render("sights/index", {
						sights: sights,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						noMatch: noMatch,
						search: false
					});
				});	
			}
		});
	}
});

//NEW
router.get("/new", middleware.checkLogin, middleware.checkAdmin, (req, res) => {
	res.render("sights/new");
});

//CREATE
router.post("/", middleware.checkLogin, middleware.checkAdmin, async (req, res) => {
	const geoData = await mapInfo(req.body.sight.location);
	const newSight = req.body.sight;
	newSight.geometry = geoData.body.features[0].geometry;
	Sight.create(newSight, (err) => {
		if(err) {
			req.flash('error', "Some error occured");
			return res.redirect('back');
		}
		res.redirect('/sights');
	});
});

// SHOW
router.get("/:id", (req, res) => {
	let sortCategory = (req.query.sortBy == 'ratings')? {rating: -1} : {createdAt: -1};
	Sight.findById(req.params.id).populate({
		path: 'reviews',
		options: {sort: sortCategory}   
	}).exec((err, foundSight) => {
		if(err) {
			req.flash('error', "Sight couldn't be found");
			return res.redirect('back');
		}
		res.render("sights/show", {sight: foundSight});
	});
});

//EDIT
router.get("/:id/edit", middleware.checkLogin, middleware.checkAdmin, (req, res) => {
	Sight.findById(req.params.id, (err, foundSight) => {
		if(err) {
			req.flash('error', "Sight couldn't be found");
			return res.redirect('back');
		}
		res.render("sights/edit", {sight: foundSight});
	});
});

//UPDATE
router.put("/:id", middleware.checkLogin, middleware.checkAdmin, async (req, res) => {
	const geoData = await mapInfo(req.body.sight.location);
	req.body.sight.geometry = geoData.body.features[0].geometry;
	Sight.findByIdAndUpdate(req.params.id, req.body.sight, (err) => {
		if(err) {
			req.flash('error', "Sight couldn't be found");
			return res.redirect("back");
		}
		req.flash('success', "Sight updated");
		res.redirect("/sights/" + req.params.id);
	});
});

//PATCH
router.patch("/:id", middleware.checkLogin, upload.array('image'), (req, res) => {
	Sight.findById(req.params.id, async (err, sight) => {
		if(err) {
			console.log(err);
			return res.redirect('back');
		}
		if(req.files.length > 0) {
			const nextGallery = sight.gallery;
			req.files.map(file => {
				nextGallery.push({url: file.path, filename: file.filename});
			})
			sight.gallery = nextGallery;
			await sight.save();	
			req.flash('success', "Image added");
		}	
		else {
			req.flash('error', "Files missing");
		}
		res.redirect("/sights/" + req.params.id);
	});
});

//DESTROY
router.delete("/:id", middleware.checkLogin, middleware.checkAdmin, (req, res) => {
	Sight.findById(req.params.id, (err, sight) => {
		if(err) {
			req.flash('error', "Sight couldn't be found");
			return res.redirect("/sights");
		}
		Review.deleteMany({"_id": {$in: sight.reviews}}, (err) => {
        	if (err) {
            	console.log(err);
                return res.redirect("/sights");
            }
			if(sight.gallery) {
				sight.gallery.forEach((img) => cloudinary.uploader.destroy(img.filename));
			}
            sight.deleteOne();
            req.flash("success", "Sight deleted successfully!");
            res.redirect("/sights");
         });
	});
});

//Regex conversion
function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?..\\^$|#\s]/g, "\\$&");
}

//Function to find sights according to search term
const searchBy = async (category, perPage, pageNumber) => {
    let sightCount = 0;
    try {
        const foundSights = await Sight.find(category)
            .skip(perPage * pageNumber - perPage)
            .limit(perPage);
        sightCount = foundSights.length;
        return { foundSights, sightCount };
    } catch (err) {
        console.log('ERROR: ', err.message);
        return { error: { message: err.message } };
    }
}

//Getting geocoding response from mapbox
const mapInfo = async (location) => {
	try {
		const geoData = await geocoder.forwardGeocode({
			query: location,
			limit: 1
		}).send();
		return geoData;
	}
	catch (err) {
		// req.flash('error', err.message);
		return err;
	}
}

module.exports = router;