const express = require('express');
const {User, Post, Like, Avatar} = require('../database/schema/schemaModel');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/', async (req, res) => {
    console.log("Session Username:", req.session.username); 
    try {
        if (!req.session.username) {
            return res.status(403).send("You must be logged in to view posts");
        }

        const user = await User.findOne({
            where: { username: req.session.username },
            include: [{ model: Avatar }]
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const posts = await Post.findAll({
            include: [{
                model: User,
                as: 'creator', 
                attributes: ['username'],  
                include: [{
                    model: Avatar,
                    attributes: ['imageUrl']
                }]
            }]
        });
        
        

        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

        res.render('posts/posts', {
            posts: posts,
            avatarUrl: avatarUrl,
            username: user.username,
        });
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        res.status(500).send("Error fetching posts");
    }
});



router.post('/', async (req, res) => {
    
    const user = User.findOne(user => user.username === req.session.username);
    if (!user) {
        return res.status(404).send("User not found");
    }
    
    const posts = await Post.findAll({
        include: [{
            model: User,
            attributes: ['username'], 
        }]
    });
    
    if(!posts) {
        return res.status(404).send("No posts found");
    }

    res.render('posts/posts', {
           posts: posts,
        username: user.username,
    });
});

router.get('/create', (req, res) => {
    res.render('posts/create', {
        username: req.session.username,
    });
});

router.post('/create', async (req, res) => {
    if (!req.session.username) {
        return res.status(403).send("You must be logged in to create posts");
    }
    try {
        const user = await User.findOne({ where: { username: req.session.username } });
        if (!user) {
            return res.status(404).send("User not found");
        }
        
        const { title, description, content } = req.body;

        const newPost = await Post.create({
            title: title,
            description: description,
            content: content,
            createdBy: user.userId,
        });

        console.log("New Post Created:", newPost);
        res.redirect('/posts');  
    } catch (error) {
        console.error('Failed to create post:', error);
        res.status(500).send('Error creating post');
    }
});

router.post('/like/:postid', async (req, res) => {
    const id = parseInt(req.params.postid, 10); 
    if (isNaN(id) || id < 0) {
        console.error('Invalid id:', id);
        return res.status(404).send('Invalid ID');
    }
    
    try {
        const post = await Post.findByPk(id);
        if (!post) {
            console.error('No post found at this id:', id);
            return res.status(404).send('Post not found');
        }
        
        const username = req.session.username;
        if (!username) {
            return res.status(403).send('You must be logged in to like posts');
        }
        
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const like = await Like.findOne({ where: { postId: id, userId: user.id } });
        if (like) {
            return res.status(409).send('User has already liked this post');
        }
        
        await Like.create({ postId: id, userId: user.id });
        post.currentLikes += 1;
        await post.save();
        
        res.json({ likes: post.currentLikes });
    } catch (error) {
        console.error('Failed to like post:', error);
        res.status(500).send('Error liking post');
    }
});


module.exports = router;
