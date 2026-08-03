const jwt = require("jsonwebtoken");
const User = require("../models/User");

/*
-------------------
Authentication Middleware

Purpose: 
Verify that the incoming request contains a valid JWT token.

If the token is valid:
    - Decode the token.
    - Find the corresponding user.
    - Attach the user to req.user.
    - Continue to the next middleware/controller.

If the token is missing or invalid: 
    - Stop the request immediately.
-------------------
*/

const protect = async (req, res, next) => {
    try{

        let token;

        //Check whether Authorization Header exist.
        if(
            req.headers.authorization && 
            req.headers.authorization.startsWith("Bearer")
        ){

            //Extract JWT token
            token = req.headers.authorization.split(" ")[1];

            //Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            /*
                - Fetched the logged-in user's details.
                - Password is excluded because controllers
                - do not need access to it. 
            */
            req.user = await User.findById(decoded.id).select("-password");

            //Continue to requested route.
            next();
        } else { 
            return res.status(401).json({
                success: false,
                message: "Access denied. Token not provided.",
            });
        }

    } catch(error){
        console.error("Authentication Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

module.exports = {
    protect,
};