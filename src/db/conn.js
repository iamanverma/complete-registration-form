const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const DB = process.env.DATABASE;
// const DB = "mongodb+srv://amanverma48003:nAmA%239211MDB@cluster0.mhqjntd.mongodb.net/Mydatabase?retryWrites=true&w=majority";

mongoose.connect(DB)
    .then(() => console.log("Connection Successful with Database 'registrationform' "))
    .catch((err) => console.log(err));