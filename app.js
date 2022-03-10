const express       = require('express');
const session       = require('express-session');
const hbs           = require('express-handlebars');
const mongoose      = require('mongoose');
const passport      = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt        = require('bcrypt');
const app           = express();

mongoose.connect("mongodb://localhost:27017/node-auth-loginteste2", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

app.engine('hbs', hbs.engine({ extname: '.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false}));
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new localStrategy(function (username, password, done) {
    User.findOne({ username: username}, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, {message: 'Falha na autenticação.'})
        }

        bcrypt.compare(password, user.password, function(err, res) {
            if (err) { return done(err); }

            if (res === false) {
                return done(null, false, { message: 'Falha na autenticação.'}) 
            } 

            if(res === true) {
                return done(null, user);
            }
        });
    });
}));

app.get('/', (req, res) => {
    res.render("index", { title: "Home"})
});

const port = 5000
app.listen(port, () => {
    console.log("Running app on port: " + port);
})
