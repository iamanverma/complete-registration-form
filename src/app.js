require('dotenv').config();
const express = require('express'); //------> Place .env file in root directory of project
const app = express();
require('./db/conn.js');        //connected to database server
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
const Register = require("./models/userReg");       //creating db collection
const auth = require("./middleware/auth.js");       //function with parameters (req,res,next)


const staticPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");


app.use(express.static(staticPath));                        //serving static website
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'hbs');
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);



//---------------Routing-------------------------------------------------

app.get('/', (req, res) => {
    res.render("index.hbs");
});
app.get('/home', (req, res) => {
    res.render("index.hbs");
});
app.get('/register', (req, res) => {
    res.render("register.hbs");
});
app.get('/login', (req, res) => {
    res.render("login.hbs");
});
// here after get /profile, auth will execute (by using next in auth.js), without which next step can't execute
app.get('/profile', auth, (req, res) => {
    // res.send(`Login Token : ${req.cookies.jwt}`);
    // console.log(`printing cookie : ${req.cookies.jwt}`); //-------> used after requiring "cookie-parser"
    res.render('profile.hbs', {
        userDocument: req.user     //------> Came from auth (req.user & req.token)
    });
});




//--------creating new user in database --------------
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        const emaill = req.body.email;
        // const {fullname, age, gender, email, phone, password} = req.body;


        //------CHECKING IF USER ALREADY REGISTERED
        const userExists = await Register.findOne({ email: emaill });
        if (userExists) {
            console.log("Email already registered !!");
            return res.status(409).render('register', { message: "Email already registered!! " });
        }
        // console.log(userExists);
        if (password === cpassword) {
            const registerEmp = new Register({
                fullname: req.body.fullname,
                age: req.body.age,
                gender: req.body.gender,
                email: req.body.email,
                phone: req.body.phone,
                password: await bcrypt.hash(req.body.password, 10)
            })

            const token = await registerEmp.generateAuthToken(); //----> this will return a token and also save that token in database
            // console.log(token);

            // STORING TOKEN IN COOKIE
            res.cookie("jwt", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 2592000000)      //-----> validity - 30days
            });

            //SAVING USER DOCUMENT WITH TOKEN IN DATABASE 
            const userRegistered = await registerEmp.save();
            // console.log("Data saved in DB")

            if (userRegistered)
                res.status(201).render("operSuccessPage", {
                    userDocument: registerEmp,
                    operationMessage: "Registration Successful !!"
                });
            else {
                console.log("Failed to register to Database")
                res.status(500).render("register", {
                    message: "Failed to Register !!"
                });
            }

        }
        else {
            // res.json({ error: "Passwords are not matching!" });
            console.log("Passwords are not matching");
            res.render("register.hbs", {
                message: "Passwords are not Matching !!"
            });
        }
    } catch (err) {
        res.status(400).send(err);
    }
});

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        //CHeking if user already logged IN
        //----------------------------------------------------------------
        oldToken = req.cookies.jwt;
        if (oldToken) {
            return res.render("login", {
                message: "User already logged IN, logout first to Continue..."
            })
        }
        //----------------------------------------------------------------



        const userDocument = await Register.findOne({ email: email });    //searching entered email and saving that document in userDocument
        const isMatch = await bcrypt.compare(password, userDocument.password);     //checking if upper document's password match with entered password or not 

        //------AT THIS POINT WE ARE ALREADY LOGGED IN, TO KEEP LOGGED IN NOW CREATING AND STORING JWT TOKEN FOR THIS LOGIN IN DATABASE AND COOKIE
        const token = await userDocument.generateAuthToken();    //generating token and saving new token in Database while log in


        //Storing TOKEN in COOKIE with name "jwt" while LOG IN
        res.cookie("jwt", token, {
            // expires: new Date(Date.now() + 300000),
            httpOnly: true,
            // secure: true
        });


        if (isMatch) {
            res.status(201).render("operSuccessPage",
                {
                    userDocument: userDocument,
                    operationMessage: "Login Successful !!"
                });
        } else {
            // res.status(400).json({ message: "Invalid login details" });
            console.log(`Password not matching for email : ${req.body.email}`);
            res.status(400).render("login", {
                message: "Invalid Login Details !!"
            });
        }

    } catch (err) {
        console.log(`Email (${req.body.email}) not registered`);
        console.log(err);
        res.status(400).render("login", {
            message: "Invalid Login Details !!"
        });
    }
});

app.get('/logout', auth, async (req, res) => {
    try {

        //  1. Logout by deleting saved TOKEN in cookie and from Database
        // req.user is the user Document (defined in auth)
        // hence req.user.tokens is all tokens stored in Database

        if (!req.token) {
            console.log("User not logged In");
            res.render('login', {
                message: "Please login first !!"
            });
        }

        req.user.tokens = req.user.tokens.filter((currElem) => { //currElem == collection of all token in Database
            return currElem.token !== req.token;                //req.token == current logged in token from COOKIE
            // returning all non-matched tokens to req.user.tokens and then saving it to database below
        })

        //  2. deleting currentLogIn token from Client Device Cookie
        await req.user.save();
        res.clearCookie("jwt");

        res.render("login", {
            message: " Logged out Successfully !!"
        });

    } catch (err) {
        console.log(err)
        res.status(500).render('login', {
            message: "Please login first !!"
        });
    }
});

app.get('/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];       //all tokens stored in database DELETED
        await req.user.save();      //changes in database saved

        res.clearCookie("jwt");     //token stored in Cookie deleted

        res.render("login", {
            message: "Logged Out Successfully from All Devices !!"
        });

    } catch (err) {
        console.log(err);
        res.status(500).render('login', {
            message: "Please login first !!"
        });
    }

});

app.get('*', (req, res) => {
    res.render('errorPage.hbs');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});