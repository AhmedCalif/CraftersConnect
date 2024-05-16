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
const { Message, User } = require('./database/schema/schemaModel');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Middleware and configurations
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

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New connection');
    socket.on('message', async (msg) => {
        const savedMessage = await saveMessage(msg);
        io.emit('message', savedMessage);
    });
});

const saveMessage = async (message) => {
    const user = await User.findById(message.user);
    const newMessage = await Message.create({
        user: user._id,
        message: message.message,
        date: message.date
    });
    return newMessage;
};

app.get('/projects/chat', async (req, res) => {
    const { projectId } = req.query;
    const chats = await Message.find({ project: projectId }).populate('user');
    res.json({ chats });
});

app.post('/projects/chat', async (req, res) => {
    const { message, receiverId, projectId, username } = req.body;
    const user = await User.findOne({ username });
    const newMessage = await Message.create({
        user: user._id,
        message,
        receiver: receiverId,
        project: projectId,
        date: new Date()
    });
    res.json(newMessage);
});

const port = 8000;
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

module.exports = { server, io };
