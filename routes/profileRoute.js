const router = require('express').Router();
const { User, Avatar } = require('../database/schema/schemaModel');
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
        const publicId = `${file.fieldname}-${Date.now()}`;
        
        return {
          folder: folderPath,
          public_id: publicId,
          format: fileExtension,
        };
      },
    });
  
    return multer({
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024, 
      },
    });
  }

const uploadFile = uploadMiddleware("/uploads");

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { username: req.session.username },
            include: [{ model: Avatar }]
        });
        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
        res.render('profile/profile', { user: user, avatar: avatarUrl });
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
        await Avatar.upsert({
            userId: userId,
            imageUrl: avatarUrl,
            uploadDate: new Date()
        });
        res.json({ imageUrl: avatarUrl });
    } catch (error) {
      console.error('Failed to upload avatar:', error.stack);
        res.status(500).json({ error: 'Failed to upload avatar.' });
    }
});


module.exports = router;
