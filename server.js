const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const middleware = require('./middleware/middleware');
const userRouter = require('./routes/userRoute');
const postsRouter = require('./routes/postsRoute');
const profileRouter = require('./routes/profileRoute');
const projectsRouter = require('./routes/projectsRouter');
const mysql = require('mysql2/promise'); 
const homeRouter = require('./routes/homeRoute');

const app = express();
const port = 8000;

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

app.use(middleware.logger);
app.use(middleware.attachUser);

app.use('/auth', userRouter);
app.use('/posts', postsRouter);
app.use('/profile', profileRouter);
app.use('/projects', projectsRouter);
app.use('/home', homeRouter)


app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use(middleware.errorHandler);

const main = async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Ahmed18131806',
        database: 'drizzle',
        port: 3306
    });

    app.post('/query', async (req, res) => {
        const { sql, params, method } = req.body;
        const sqlBody = sql.replace(/;/g, ''); 

        try {
            const result = await connection.query({
                sql: sqlBody,
                values: params,
                rowsAsArray: method === 'all',
                typeCast: function (field, next) {
                    if (field.type === 'TIMESTAMP' || field.type === 'DATETIME' || field.type === 'DATE') {
                        return field.string();
                    }
                    return next();
                }
            });

            if (method === 'all') {
                return res.send(result[0]);
            } else if (method === 'execute') {
                return res.send(result);
            } else {
                return res.status(500).json({ error: 'Unknown method value' });
            }
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
};

// app.post("upload", multer.upload("single", (req, res) => {
//     const b64 = Buffer.from(req.file.buffer).toString("base64");
//     let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

// }))

main().catch(console.error);
