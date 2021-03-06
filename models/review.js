const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    rating: {
        // Setting the field type
        type: Number,
        required: "Please provide a rating (1-5 stars).",
        min: 1,
        max: 5,
        // Adding validation to see if the entry is an integer
        validate: {
            // validator accepts a function definition which it uses for validation
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value."
        }
    },
    // review text
    text: {
        type: String
    },
    // author id and username fields
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    // sight associated with the review
    sight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sight"
    }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});

module.exports = mongoose.model("Review", reviewSchema);