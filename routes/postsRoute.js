const router = require('express').Router();
const posts = require('../models/postModel');
const { users } = require('../models/userModel');

router.get('/', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }

    const user = users.find(user => user.username === req.session.username);
    if (!user) {
        return res.status(404).send("User not found");
    }

    res.render('posts/posts', {
        posts: posts,
        username: user.username,
        avatar: user.avatar
    });
});

router.post('/', (req, res) => {
    const { username, password, email } = req.body;
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
        return res.status(409).send('Username already exists');  
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        username,
        password: hashedPassword,
        email,
        avatar: 'default-avatar.jpg' 
    };

    users.push(newUser);
    req.session.username = username; 
    res.redirect('/posts');
});

router.get('/create', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }
    res.render('posts/create', {
        username: req.session.username,
        avatar: users.find(user => user.username === req.session.username)?.avatar
    });
});

router.post('/create', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }

    const user = users.find(user => user.username === req.session.username);
    if (!user) {
        return res.status(404).send("User not found");
    }

    const { title, description, content } = req.body;
    const newPost = {
        id: posts.length + 1,  
        createdBy: user.username,
        title: title,
        content: content,
        description: description,
        date: new Date().toLocaleDateString("en-US"), 
        avatar: user.avatar
    };

    posts.push(newPost);
    res.redirect('/posts');  
});



router.get('/update/:id', (req, res) => {
    const post = posts.find(post => post.id === parseInt(req.params.id));
    res.render('posts/update', { post });
});

router.post('/update/:id', (req, res) => {
    const post = posts.find(post => post.id === parseInt(req.params.id));
    if (post) {
        post.title = req.body.title;
        post.content = req.body.content;
        res.redirect('/posts');
    } else {
        res.status(404).send('Post not found');
    }
});

router.get('/delete/:id', (req, res) => {
    res.render('posts/delete', { id: req.params.id });
});

router.post('/delete/:id', (req, res) => {
    const postIndex = posts.findIndex(post => post.id === parseInt(req.params.id));
    if (postIndex !== -1) {
        posts.splice(postIndex, 1);
        res.redirect('/posts');
    } else {
        res.status(404).send('Post not found');
    }
});

module.exports = router;
