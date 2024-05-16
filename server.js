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
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

const { Message, User } = require('./database/schema/schemaModel'); 


wss.on('connection', (ws, req) => {
    const sessionParser = (ws) => {
        return new Promise((resolve, reject) => {
            session(req, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(req.session);
                }
            });
        });
    };

    sessionParser(ws).then(session => {
        const username = session.username;
        console.log('Client connected with username:', username);

        ws.on('message', async (data) => {
            const messageData = JSON.parse(data);
            const { message, receiverId, projectId } = messageData;

            console.log('Received message:', messageData);

            const user = await User.findOne({ where: { username: username } });
            if (!user) {
                console.error('User does not exist');
                return;
            }

            const receiver = await User.findOne({ where: { userId: receiverId } });
            if (!receiver) {
                console.error('Receiver does not exist');
                return;
            }

            try {
                // Save the message to the database
                const newMessage = await Message.create({
                    message,
                    userId: user.userId,
                    receiverId,
                    projectId
                });

                const broadcastData = {
                    username: user.username,
                    message: newMessage.message,
                    projectId,
                };

                // Broadcast the new message to all connected clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(broadcastData));
                    }
                });
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    }).catch(err => {
        console.error('Failed to parse session:', err);
        ws.terminate();
    });
});

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

app.use(middleware.attachUser);

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

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = {server, wss}
