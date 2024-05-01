const express = require('express');
const app = express();
const port = 8000;
const session = require('express-session');
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoute');
const postsRouter = require('./routes/postsRoute');
const middleware = require('./middleware/middleware');
const profileRouter = require('./routes/profileRoute');

// Configure session middleware first
app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: false, // should be true if you want the session to be saved before modification
    cookie: { secure: false } // set to true in production if using HTTPS
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Body parser to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Custom middleware for logging, attaching user, and handling errors
app.use(middleware.logger);
app.use(middleware.attachUser);

// Route handlers
app.use('/auth', userRouter);
app.use('/posts', postsRouter);
app.use('/profile', profileRouter);

// Middleware to ensure user is authenticated
app.use('/dashboard', middleware.ensureAuthenticated, (req, res) => {
    res.render('dashboard');
});

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

// Error handler should be last
app.use(middleware.errorHandler);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
