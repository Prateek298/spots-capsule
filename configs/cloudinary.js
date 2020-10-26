const cloudinary            = require('cloudinary').v2,
	  { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'Sights',
		allowedFormats: ['jpeg', 'png', 'jpg']
	}
});

module.exports = { cloudinary, storage }