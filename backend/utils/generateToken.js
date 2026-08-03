const jwt = require("jsonwebtoken");

/*
-----------
Generate JWT token

Creates a signed JSON Web Token containing the user's ID.
The token is later used to verify the user's identity on
protected routes. 
-----------
*/

const generateToken = (userId) => {
    return jwt.sign(
        {
            id: userId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );
};

module.exports = generateToken;