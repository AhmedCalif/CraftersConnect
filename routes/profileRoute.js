const router = require('express').Router();
const { users } = require('../models/userModel');
const posts = require('../models/postModel');
const { ensureAuthenticated } = require('../middleware/middleware');


router.get('/', ensureAuthenticated, async (req, res) => {
    console.log('Session username:', req.session.username);

    try {
        const user = users.find(user => user.username === req.session.username);
        console.log('User found:', user);
        const userPosts = posts.filter(post => post.name === req.session.username);
        console.log('User Posts:', userPosts);
        res.render('profile', { user: user, avatar: user.avatar, posts: userPosts}); 
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router;
