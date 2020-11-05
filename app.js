const express       = require('express'),
	  app           = express(),
	  bodyParser    = require('body-parser'),
	  passport      = require('passport'),
	  flash         = require('connect-flash'),
	  mongoSanitize = require('express-mongo-sanitize'),
	  session       = require('express-session'),
	  mongoDBStore  = require('connect-mongo')(session),
	  helmet        = require('helmet');

const connectDB = require('./configs/db');
const User = require("./models/user");

//Basic configs
if (process.env.NODE_ENV !== "production") {
	require('dotenv').config({ path: './secret.env'});
}
require("./configs/passPort")(passport);
app.set("view engine", 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('method-override')("_method"));
app.use(flash());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());

app.locals.moment = require('moment');

const secret = process.env.MONGO_SECRET || "noOneKnows";

const store = new mongoDBStore({
	url: process.env.MONGO_URI_ATLAS || "mongodb://localhost:27017/Project",
	secret,
	touchAfter: 2 * 60 * 60
});

store.on('error', (e) => console.log("session store error", e));

app.use(session({
	store,
	secret,
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Allows server side values to be used in templates
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
});

//Routes
app.use("/sights", require("./routes/sights"));
app.use(require("./routes/auth"));
app.use(require("./routes/index"));
app.use("/sights/:id/reviews", require("./routes/reviews"));
app.use("/users", require("./routes/users"));

connectDB();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));