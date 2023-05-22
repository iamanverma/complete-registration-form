//a function with parameters (req,res,next)
const jwt = require('jsonwebtoken');
const Register = require("../models/userReg");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        // const verifiedUser = jwt.verify(token, process.env.SECRET_KEY);
        const verifiedUser = jwt.verify(token, "mynameisamanvermathisissecretkey");
        // console.log(verifiedUser);

        //----------Getting whole user Data using TOKEN only
        const userDocument = await Register.findOne({ _id: verifiedUser._id })
        console.log(` User age is ${userDocument.age} years`);

        //saving current TOKEN and userDocument (req.token and req.user) to use later in LOGOUT
        req.token = token;
        req.user = userDocument;

        //if user is genuine then hitting next
        next();

    } catch (err) {
        console.log("Error after Authorization : ")
        console.log(err);
        res.status(401).render('login',{
            message : "Please login first !!" 
        });
    }
}

module.exports = auth;