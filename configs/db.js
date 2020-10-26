const mongoose = require('mongoose');

const dbUrl = process.env.MONGO_URI_ATLAS || "mongodb://localhost:27017/Project";

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(dbUrl, {
			useNewUrlParser: true,
  			useUnifiedTopology: true,
  			useFindAndModify: false,
  			useCreateIndex: true
		});
		console.log("MongoDB connected");
	} 
	catch (err) {
		console.log(err);
	}
}

module.exports = connectDB;