const express = require('express');
const { User, Post, Like, Avatar } = require('../database/schema/schemaModel');
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
                attributes: ['userId', 'username'],
                include: [{ model: Avatar, attributes: ['imageUrl'] }]
            }]
        });

        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
        const uniquePosts = [];
        const postIds = new Set();
        for (const post of posts) {
            if (!postIds.has(post.postId)) {
                const isLiked = await post.isLikedBy(user.userId);
                uniquePosts.push({ ...post.toJSON(), isLiked });
                postIds.add(post.postId);
            }
        }

        res.render('posts/posts', {
            posts: uniquePosts,
            avatarUrl: avatarUrl,
            username: user.username,
            currentUser: { userId: user.userId }
        });

    } catch (error) {
        console.error('Failed to fetch posts:', error);
        res.status(500).send("Error fetching posts");
    }
});

router.post('/like/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        console.error('Invalid id:', id);
        return res.status(404).json({ message: 'Invalid ID' });
    }

    try {
        const post = await Post.findByPk(id);
        if (!post) {
            console.error('No post found at this id:', id);
            return res.status(404).json({ message: 'Post not found' });
        }

        const username = req.session.username;
        const userId = req.session.userId;
        if (!username || !userId) {
            return res.status(403).json({ message: 'You must be logged in to like posts' });
        }

        const like = await Like.findOne({ where: { postId: id, userId: userId } });
        if (like) {
            return res.status(409).json({ message: 'User has already liked this post' });
        }

        await Like.create({ postId: id, userId: userId, likedBy: username });
        post.currentLikes += 1;
        await post.save();

        console.log('Post liked:', post.title, 'Current likes:', post.currentLikes);
        res.json({ message: 'Post successfully liked', likes: post.currentLikes });
    } catch (error) {
        console.error('Failed to like post:', error);
        res.status(500).json({ message: `Error liking post: ${error.message}` });
    }
});

router.post('/unlike/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            console.error('Invalid id:', id);
            return res.status(404).json({ message: 'Invalid ID' });
        }

        const post = await Post.findByPk(id);
        if (!post) {
            console.error('No post found at this id:', id);
            return res.status(404).json({ message: 'Post not found' });
        }

        const unlike = await Like.findOne({ where: { postId: id, userId: req.session.userId } });
        if (!unlike) {
            console.error('No like found for this user and post:', id);
            return res.status(404).json({ message: 'Like not found' });
        }

        await unlike.destroy();
        post.currentLikes -= 1;
        await post.save();
        console.log('Post unliked:', 'Current likes:', post.currentLikes);

        res.json({ likes: post.currentLikes });
    } catch (error) {
        console.error('Failed to unlike post:', error);
        res.status(500).json({ message: 'Failed to unlike post' });
    }
});

router.delete('/:postId', async (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId;

    try {
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        if (post.createdBy !== userId) {
            return res.status(403).json({ message: "You can only delete your own posts." });
        }

        await post.destroy();
        res.json({ message: "Post successfully deleted." });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Failed to delete post." });
    }
});

router.get('/create', (req, res) => {
    res.render('posts/create', {
        username: req.session.username,
    });

    router.post('/create', async (req, res) => {
        if (!req.session.username) {
            return res.status(403).send("You must be logged in to create posts");
        }

        const { title, description, content } = req.body;
        if (title.length > 100 || description.length > 100) {
            return res.status(400).send("Title and description must be less than 100 characters");
        }

        try {
            const user = await User.findOne({ where: { username: req.session.username } });
            if (!user) {
                return res.status(404).send("User not found");
            }

            const newPost = await Post.create({
                title: title,
                description: description,
                content: content,
                createdBy: user.userId
            });

            req.session.lastPostTime = new Date();
            console.log("New Post Created:", newPost);
            res.redirect('/posts');
        } catch (error) {
            console.error('Failed to create post:', error);
            res.status(500).send('Error creating post');
        }
    });
});

module.exports = router;


