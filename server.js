const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoute');
const postsRouter = require('./routes/postsRoute');
const middleware = require('./middleware/middleware');
const profileRouter = require('./routes/profileRoute');
const projectsRouter = require('./routes/projectsRouter');

const app = express();
const port = 8000;

app.use(session({
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false,
        maxAge: 1000 * 60 * 60 * 24
     }
}));


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(middleware.logger);
app.use(middleware.attachUser);

app.use('/auth', userRouter);
app.use('/posts', postsRouter);
app.use('/profile', profileRouter);
app.use('/projects', projectsRouter);

app.use('/dashboard', middleware.ensureAuthenticated, (req, res) => {
    res.render('dashboard');
});







app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use(middleware.errorHandler);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
