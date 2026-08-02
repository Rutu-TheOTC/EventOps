const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

/*
----------------
User Schema

This schema stores every person who uses EventOps.
Different roles(Admin, Organizer, Attendee) are managed using 
the 'role' field instead of creating separate collections.
----------------
*/

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is requrired"],
            trim: true,
        },

        email: {
            type: String,
            required: [true, "Email is requrired"],
            unique: true,
            lowercase: true,
            trim: true,

            //Validate email format before saving 
            validate: [validator.isEmail, "Please Enter a valid email"],
        },

        password: {
            type: String,
            required: [true, "Password is requrired"],
            minlength: 6,

            //Never send password back in API responses by default.
            select: false,
        },

        role: {
            type: String,
            enum: ["admin","organizer","attendee"],
            default: "attendee",
        },

        avatar: {
            type: String,
            default: "",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
    },

    {
        timestamps: true,
    }
);


/*
---------
Hash Password Before Saving

This middleware runs automatically before a new user document is saved.
It converts the plain password into a secured hashed password.
----------
*/
userSchema.pre("save", async function (next) {
    //Skip hashing if password wasn't changed 
    if(!this.isModified("password")){
        return next();
    }

    //Generate a salt for stronger password security 
    const salt = await bcrypt.genSalt(10);

    //Replace plain password with hashed password
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

module.exports = mongoose.model("User", userSchema);