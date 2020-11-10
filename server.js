const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');

const app = express();
const mongodb = 'mongodb://localhost/myChat';

mongoose.connect(mongodb, {useNewUrlParser : true, useUnifiedTopology: true})
    .then(() => console.log('connected to database'))
    .catch(err => console.log(err))

const port = process.env.PORT|| 4000;
app.use(express.json());
app.use(express.urlencoded({extended: true}));

require('./auth_setup/passport')(passport);
app.use(session({
    secret : 'cat',
    saveUninitialized : 'true',
    resave : true,
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/authentication', require('./routes/authentication'));
app.use('/dashboard', require('./routes/dashboard'));

app.listen(port, () => console.log(`you are listening to port ${port}`));