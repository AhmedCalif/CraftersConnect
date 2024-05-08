const router = require('express').Router();
const { User, Post, Avatar } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');

router.get('/', ensureAuthenticated, async (req, res) => {
    console.log('Session username:', req.session.username);

    try {
        const user = await User.findOne({
            where: { username: req.session.username },
            include: [{ model: Avatar }]
        });
        console.log('User found:', user);
        const posts = await Post.findAll({
            include: [{
                model: User,
                attributes: ['username']
            }]
        });
        console.log('User Posts:', posts);
        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
        res.render('profile/profile', { user: user, avatar: avatarUrl , posts: posts }); 
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
