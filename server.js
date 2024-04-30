const express = require('express');
const app = express();
const port = 8000;
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoute');
const path = require('path');


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/auth/login');
}
);

app.get('/dashboard', (req, res) => {
res.render('dashboard');
});

app.use(express.urlencoded({ extended: true }));
app.use('/auth', userRouter);




app.listen(port, () => {
console.log('Server is running on port 8000');
});