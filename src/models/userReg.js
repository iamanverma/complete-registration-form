const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


//---------USER SCHEMA---------
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    email: {
        type: String, required: true, unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email!!");
            }
        }
    },
    phone: { type: Number, required: true, unique: [true, "Phone No already present"], minlen: [10,"Please enter correct phone no"], maxlen: [10,"Please enter correct phone no"] },
    password: { type: String, required: true },
    tokens: [       //array of objects for various logins
        { token: { type: String, required: true } }
    ]
});



//----------Function to generate Tokens for a Document--------------
// hence using methods for a document-------------
//  jwt.sign({object},"minimum 32 letter long characters")

userSchema.methods.generateAuthToken = async function () {
    try {
        const newToken = jwt.sign({ _id: this._id.toString() }, process.env.SECRET_KEY);
        // const newToken = jwt.sign({ _id: this._id.toString() }, "mynameisamanvermathisissecretkey");
        this.tokens = this.tokens.concat({ token: newToken });     //adding tokens added to previously added token
        await this.save();          //saving tokens object into database => this refers to document when calling
        return newToken;            //returning newly added token to this function
    } catch (err) {
        res.send(err);
    }
}




//-----WHILE LOGGING
//---- running bcrypt function before/pre "save" method and then passing next

// userSchema.pre("save", async function (next) {
//     if (this.isModified("password")) {      //only adding or while modifying password, hashing runs (will not run when saving some data other than password)
//         this.password = await bcrypt.hash(this.password, 10);  //by default 10 rounds
//         // this.confirmpassword = undefined;       //this will not stored in database
//         this.confirmpassword = await bcrypt.hash(this.password, 10);
//     }
//     next();
// })

const Register = new mongoose.model('Register', userSchema);
module.exports = Register;
