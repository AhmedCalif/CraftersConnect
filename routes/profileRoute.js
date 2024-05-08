const router = require('express').Router();
const { User, Post, Avatar } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');

const uploadDirectory = path.join(__dirname, '../public/uploads'); 


fs.mkdir(uploadDirectory, { recursive: true })
    .then(() => console.log('Upload directory created'))
    .catch(err => console.error('Failed to create upload directory:', err));


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { username: req.session.username }, 
            include: [{ model: Avatar }]
        });

        const posts = await Post.findAll({
            include: [{
                model: User,
                as: 'creator',
                attributes: ['username']
            }]
        });

        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
        res.render('profile/profile', { user: user, avatar: avatarUrl, post: posts });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/upload-avatar', ensureAuthenticated, upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const userId = req.session.userId;
    const user = await User.findByPk(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    const avatarUrl = '/' + path.relative(path.join(__dirname, '../public'), req.file.path);
    try {
        await Avatar.upsert({
            userId: userId,
            imageUrl: avatarUrl,
            uploadDate: new Date()
        });

        res.json({ imageUrl: avatarUrl });
    } catch (error) {
        console.error('Failed to upload avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar.' });
    }
});


module.exports = router;