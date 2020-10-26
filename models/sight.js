const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200,h_100');
});

const sightSchema = new mongoose.Schema({
	placeName: String,
	showPic: String,
	gallery: [ ImageSchema ],
	location: String,
	geometry: {
		type: {
			type: String,
			enum: ['Point'],
			required: true
		},
		coordinates: {
			type: [Number],
			required: true
		}
	},
	creator: String,
	builtIn: String,
	wiki: String,
	desc: String,
	reviews: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Review"
	}],
	rating: { type: Number, default: 0 }
});

module.exports = new mongoose.model("Sight", sightSchema);