const router = require('express').Router();
const { User, Avatar, Post, Like } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');
const multer = require('multer');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig.js");
const path = require('path');

function uploadMiddleware(folderName) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        const folderPath = `${folderName.trim()}`;
        const fileExtension = path.extname(file.originalname).substring(1);
        const publicId = `${req.session.userId}-${file.fieldname}`;
        
        return {
            folder: folderPath,
            public_id: publicId,
            format: fileExtension,
            overwrite: true,
        };
        
    },
});
return multer({ storage: storage });
}



const uploadFile = uploadMiddleware("/uploads");

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { username: req.session.username },
            include: [{ model: Avatar }]
        });
        const likedPosts = await Post.findAll({
            include: [{
                model: Like,
                as: 'Likes',
                required: true,
                where: { userId: user.userId }  
            }, {
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
        res.render('profile/profile', { user: user, avatar: avatarUrl, likedPosts: likedPosts });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/upload-avatar', ensureAuthenticated, uploadFile.single('avatar'), async (req, res) => {
    if (!req.file) {
        console.log("No file uploaded.");
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const userId = req.session.userId;
        const user = await User.findByPk(userId);
        if (!user) {
            console.log("User not found.");
            return res.status(404).json({ error: 'User not found.' });
        }
        const avatarUrl = req.file.path; 
        const existingAvatar = await Avatar.findOne({ where: { userId: userId } });
        if (existingAvatar) {
            await Avatar.update({
                imageUrl: avatarUrl,
                uploadDate: new Date()
            }, {
                where: { userId: userId }
            });
        } else {
            await Avatar.create({
                userId: userId,
                imageUrl: avatarUrl,
                uploadDate: new Date()
            });
        }
    } catch (error) {
        console.error('Failed to upload avatar:', error.stack);
        res.status(500).json({ error: 'Failed to upload avatar.' });
    }
});
router.get('/liked-posts', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { username: req.session.username },
            include: [{ model: Avatar }]
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

        const likedPosts = await Post.findAll({
            include: [{
                model: Like,
                as: 'Likes',
                required: true,
                where: { userId: user.userId }  
            }, {
                model: User,
                as: 'creator',
                attributes: ['username'],
                include: [{
                    model: Avatar,
                    attributes: ['imageUrl']
                }]
            }]
        });

        if (likedPosts.length === 0) {
            return res.status(404).send("No liked posts found");
        }

        res.render('profile/likedPosts', { user: user, likedPosts: likedPosts, avatar: avatarUrl });
    } catch (error) {
        console.error("Failed to retrieve liked posts:", error);
        res.status(500).send("Error retrieving liked posts");
    }
});


module.exports = router;
