// profileRoute.js
const express = require('express');
const { db } = require('../database/databaseConnection.js');
const { eq, and } = require ('drizzle-orm');
const { users, avatars, posts, likes }= require('../database/schema/schemaModel.js')
const { ensureAuthenticated } = require('../middleware/middleware.js');
const multer = require ('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinaryConfig.js');
const path = require('path');

const router = express.Router();

function uploadMiddleware(folderName) {
    const storage = new CloudinaryStorage({
        cloudinary,
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
    return multer({ storage });
}

const uploadFile = uploadMiddleware("/uploads");

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        // Get user with avatar
        const user = await db.select()
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username))
            .get();

        // Get liked posts
        const likedPosts = await db.select({
            post: posts,
            creator: users,
            creatorAvatar: avatars
        })
        .from(posts)
        .innerJoin(likes, eq(posts.postId, likes.postId))
        .leftJoin(users, eq(posts.createdBy, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId))
        .where(eq(likes.userId, user.users.userId));

        const avatarUrl = user.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3';
        
        res.render("profile/profile", {
            user: user.users,
            avatar: avatarUrl,
            likedPosts
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/upload-avatar", ensureAuthenticated, uploadFile.single("avatar"), async (req, res) => {
    if (!req.file) {
        console.log("No file uploaded.");
        return res.status(400).json({ error: "No file uploaded." });
    }

    try {
        const userId = req.session.userId;
        const user = await db.select()
            .from(users)
            .where(eq(users.userId, userId))
            .get();

        if (!user) {
            console.log("User not found.");
            return res.status(404).json({ error: "User not found." });
        }

        const avatarUrl = req.file.path;
        const existingAvatar = await db.select()
            .from(avatars)
            .where(eq(avatars.userId, userId))
            .get();

        if (existingAvatar) {
            await db.update(avatars)
                .set({
                    imageUrl: avatarUrl,
                    uploadDate: new Date()
                })
                .where(eq(avatars.userId, userId));
        } else {
            await db.insert(avatars)
                .values({
                    userId,
                    imageUrl: avatarUrl,
                    uploadDate: new Date()
                });
        }

        res.redirect("back");
    } catch (error) {
        console.error("Failed to upload avatar:", error.stack);
        return res.status(500).json({ error: "Failed to upload avatar." });
    }
});

router.get("/liked-posts", ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.select()
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username))
            .get();

        if (!user) {
            return res.status(404).send("User not found");
        }

        const avatarUrl = user.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3';

        const likedPosts = await db.select({
            post: posts,
            creator: users,
            creatorAvatar: avatars
        })
        .from(posts)
        .innerJoin(likes, eq(posts.postId, likes.postId))
        .leftJoin(users, eq(posts.createdBy, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId))
        .where(eq(likes.userId, user.users.userId));

        if (likedPosts.length === 0) {
            res.render("profile/errorMessage");
        } else {
            res.render("profile/likedPosts", {
                user: user.users,
                likedPosts,
                avatar: avatarUrl,
            });
        }
    } catch (error) {
        console.error("Failed to retrieve liked posts:", error);
        res.status(500).send("Error retrieving liked posts");
    }
});
module.exports = router;