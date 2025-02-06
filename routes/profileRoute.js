const express = require('express');
const { db } = require('../database/databaseConnection.js');
const { eq } = require('drizzle-orm');
const { users, avatars, posts, likes } = require('../database/schema/schemaModel.js');
const { ensureAuthenticated } = require('../middleware/middleware.js');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinaryConfig.js');
const path = require('path');

const router = express.Router();

function uploadMiddleware(folderName) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: (req, file) => ({
            folder: folderName.trim(),
            public_id: `${req.session.userId}-${file.fieldname}`,
            format: path.extname(file.originalname).substring(1),
            overwrite: true,
        }),
    });
    return multer({ storage });
}

const uploadFile = uploadMiddleware("/uploads");

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        // Get user data
        const userData = await db
            .select()
            .from(users)
            .where(eq(users.username, req.session.username));

        if (!userData || userData.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = userData[0];

        // Get avatar data
        const avatarData = await db
            .select()
            .from(avatars)
            .where(eq(avatars.userId, user.userId));

        // Get liked posts
        const likedPostsData = await db
            .select({
                likeId: likes.likeId,
                postId: posts.postId,
                title: posts.title,
                description: posts.description,
                currentLikes: posts.currentLikes,
                likedBy: likes.likedBy,
                createdAt: posts.createdAt,
                createdBy: posts.createdBy
            })
            .from(likes)
            .innerJoin(posts, eq(likes.postId, posts.postId))
            .where(eq(likes.likedBy, user.username));

        const avatarUrl = avatarData?.[0]?.imageUrl || 'https://i.pravatar.cc/150?img=3';
        
        res.render("profile/profile", {
            user,
            avatar: avatarUrl,
            likedPosts: likedPostsData
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/upload-avatar", ensureAuthenticated, uploadFile.single("avatar"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    try {
        const userId = req.session.userId;
        const avatarUrl = req.file.path;

        // Check if avatar exists
        const existingAvatar = await db
            .select()
            .from(avatars)
            .where(eq(avatars.userId, userId));

        if (existingAvatar && existingAvatar.length > 0) {
            await db
                .update(avatars)
                .set({
                    imageUrl: avatarUrl,
                    uploadDate: new Date()
                })
                .where(eq(avatars.userId, userId));
        } else {
            await db
                .insert(avatars)
                .values({
                    userId,
                    imageUrl: avatarUrl,
                    uploadDate: new Date()
                });
        }

        res.redirect("back");
    } catch (error) {
        console.error("Failed to upload avatar:", error);
        return res.status(500).json({ error: "Failed to upload avatar." });
    }
});

router.get("/liked-posts", ensureAuthenticated, async (req, res) => {
    try {
        // Get user data
        const userData = await db
            .select()
            .from(users)
            .where(eq(users.username, req.session.username));

        if (!userData || userData.length === 0) {
            return res.status(404).send("User not found");
        }

        const user = userData[0];

        // Get avatar data
        const avatarData = await db
            .select()
            .from(avatars)
            .where(eq(avatars.userId, user.userId));

        // Get liked posts
        const likedPostsData = await db
            .select({
                likeId: likes.likeId,
                postId: posts.postId,
                title: posts.title,
                description: posts.description,
                currentLikes: posts.currentLikes,
                likedBy: likes.likedBy,
                createdAt: posts.createdAt,
                createdBy: posts.createdBy
            })
            .from(likes)
            .innerJoin(posts, eq(likes.postId, posts.postId))
            .where(eq(likes.likedBy, user.username));

        const avatarUrl = avatarData?.[0]?.imageUrl || 'https://i.pravatar.cc/150?img=3';

        if (likedPostsData.length === 0) {
            res.render("profile/errorMessage");
        } else {
            res.render("profile/likedPosts", {
                user,
                likedPosts: likedPostsData,
                avatar: avatarUrl
            });
        }
    } catch (error) {
        console.error("Failed to retrieve liked posts:", error);
        res.status(500).send("Error retrieving liked posts");
    }
});

module.exports = router;