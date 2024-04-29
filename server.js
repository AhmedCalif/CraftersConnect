const express = require('express');
const app = express();
const port = 8000;
const bodyParser = require('body-parser');
const userRouter = require('./routes/userRoute');


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
res.send('Welcome');
});

app.use(express.urlencoded({ extended: true }));
app.use('/auth', userRouter);




app.listen(port, () => {
console.log('Server is running on port 8000');
});