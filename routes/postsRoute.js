const express = require('express');
const { users } = require('../models/userModel.js');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }

    const user = users.find(user => user.username === req.session.username);
    if (!user) {
        return res.status(404).send("User not found");
    }
    const postsWithAvatars = posts.map((post) => {
        const postCreator = users.find(user => user.username === post.createdBy);
        return {
            ...post,
            avatar: postCreator ? postCreator.avatar : 'default-avatar.jpg'
        };
    });

    res.render('posts/posts', {
        posts: postsWithAvatars,
        username: user.username,
        avatar: user.avatar,  
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
        currentLikes: 0, // Set initial likes count to 0 for new posts
        likedBy: [],
        avatar: user.avatar,
        
    };
    console.log(newPost.id);

    posts.push(newPost);
    res.redirect('/posts');  
});

router.post('/like/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 0) {
        console.error('Invalid id:', id);
        return res.status(404).send('Invalid ID');
    }
    const post = posts.find(p => p.id === id);
    if (!post) {
        console.error('No post found at this id:', id);
        return res.status(404).send('Post not found');
    }
    if (!Array.isArray(post.likedBy)) {
        post.likedBy = [];
    }

    const username = req.session.username;
    if (!username) {
        return res.status(403).send('You must be logged in to like posts');
    }
    if (!post.likedBy.includes(username)) {
        post.currentLikes += 1;
        post.likedBy.push(username);
        res.json({ likes: post.currentLikes });
    } else {
        res.status(409).send('User has already liked this post');
    }
});

module.exports = router;
