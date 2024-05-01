const router = require('express').Router();
const posts = require('../models/postModel');
const {users} = require('../models/userModel');
const userRouter = require('./userRoute');


router.get('/', (req, res) => {
    console.log("Session Username:", req.session.username);  
    const user = users.find(user => user.username === req.session.username);
    console.log("Found User:", user); 
    if (!user) {
        return res.status(404).send("User not found");  
    }
    res.render('posts', { posts: posts, user: user, avatar: user.avatar});  
});

router.get('/create', (req, res) => {
    res.render('create');
});

router.post('/create', (req, res) => {
    const { title, content } = req.body;
    posts.push({ id: posts.length + 1, title, content });
    res.redirect('/posts');
});

router.get('/update/:id', (req, res) => {
    res.render('update', { post });
});
router.post('/update/:id', (req, res) => { 
    const post = posts.find(post => post.id === parseInt(req.params.id));
    post.title = req.body.title;
    post.content = req.body.content;
    res.redirect('/posts');
});

router.get('/delete/:id', (req, res) => {
 res.render('delete', { id: req.params.id });
});

router.post('/delete/:id', (req, res) => {
    const postIndex = posts.findIndex(post => post.id === parseInt(req.params.id));
    posts.splice(postIndex, 1);
    res.redirect('/posts');
});

module.exports = router;