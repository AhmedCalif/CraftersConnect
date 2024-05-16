const express = require('express');
const session = require('express-session');
require('dotenv').config();
const bodyParser = require('body-parser');
const middleware = require('./middleware/middleware');
const userRouter = require('./routes/userRoute');
const postsRouter = require('./routes/postsRoute');
const profileRouter = require('./routes/profileRoute');
const projectsRouter = require('./routes/projectsRouter');
const homeRouter = require('./routes/homeRoute');
const userProjectsRouter = require('./routes/userProjectsRouter');
const chatRouter = require('./routes/chatRoute');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(middleware.attachUser);

// Route configurations
app.use('/auth', userRouter);
app.use('/posts', postsRouter);
app.use('/profile', profileRouter);
app.use('/projects', projectsRouter);
app.use('/home', homeRouter);
app.use('/my-projects', userProjectsRouter);
app.use('/chat', chatRouter);

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use(middleware.errorHandler);

const port = 8000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
