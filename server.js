const express = require('express');
const app = express();
const port = 8000;
const bodyParser = require('body-parser');



app.get('/', (req, res) => {
    res.send('Hello World!');
    }
);



app.listen(port, () => {
console.log('Server is running on port 8000');
});