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

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

app.get('/', isLoggedIn,(req, res) => {
    res.render("index", { title: "Home"})
});

app.get('/login', isLoggedOut,(req, res) => {
    let response = {
        title: "Login",
        error: req.query.error
    }

    res.render('login', response)
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=true'
}))

app.get('/logout', function (req, res) {
    req.logOut();
    res.redirect('/');
})

app.get('/setup', async (req, res) => {
    const exists = await User.exists({ username: "admin"});

    if (exists) {
        console.log("Exists")
        res.redirect('/login');
        return
    }

    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }
        bcrypt.hash("pass", salt, function (err, hash) {
            if (err) {
                return next(err);
            }
            const newAdmin = new User({
                username: "admin",
                password: hash
            });

            newAdmin.save();

            res.redirect('/login')
        });
    });
});

const port = 5000
app.listen(port, () => {
    console.log("Running app on port: " + port);
})
