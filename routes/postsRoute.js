const express = require('express');
const { eq, and } = require('drizzle-orm');
const { db } = require('../database/databaseConnection.js');
const { posts, users, likes, avatars } = require('../database/schema/schemaModel.js')

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        if (!req.session.username) {
            return res.status(403).send("You must be logged in to view posts");
        }

        // Get current user data - similar to dashboard approach
        const userData = await db
            .select({
                userId: users.userId,
                username: users.username,
                avatarUrl: avatars.imageUrl
            })
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username));

        const user = userData[0];

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get posts with creator info and avatars - matching dashboard structure
        const postsData = await db
            .select({
                postId: posts.postId,
                title: posts.title,
                description: posts.description,
                currentLikes: posts.currentLikes,
                createdAt: posts.createdAt,
                creatorId: users.userId,
                creatorUsername: users.username,
                creatorAvatar: avatars.imageUrl
            })
            .from(posts)
            .leftJoin(users, eq(posts.createdBy, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId));

        // Get likes for the current user
        const userLikes = await db
            .select({
                postId: likes.postId
            })
            .from(likes)
            .where(eq(likes.likedBy, user.userId));

        const likedPostIds = new Set(userLikes.map(like => like.postId));

        // Format posts to match dashboard structure
        const processedPosts = postsData.map(post => ({
            postId: post.postId,
            title: post.title,
            description: post.description,
            currentLikes: post.currentLikes,
            createdAt: post.createdAt,
            creator: {
                userId: post.creatorId,
                username: post.creatorUsername,
                avatar: {
                    imageUrl: post.creatorAvatar || 'https://i.pravatar.cc/150?img=3'
                }
            },
            isLiked: likedPostIds.has(post.postId)
        }));

        res.render('posts/posts', {
            posts: processedPosts,
            avatarUrl: user.avatarUrl,
            username: user.username,
            currentUser: { 
                userId: user.userId,
                avatarUrl: user.avatarUrl
            }
        });

    } catch (error) {
        console.error('Failed to fetch posts:', error);
        res.render('posts/posts', {
            posts: [],
            username: req.session.username,
            currentUser: { userId: req.session.userId }
        });
    }
});


router.post("/create", async (req, res) => {
    try {
        const { title, description } = req.body;
        
        if (!req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                message: "You must be logged in to create a post" 
            });
        }

        // Validate required fields
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Title and description are required" 
            });
        }

        // Add some basic validation for field lengths
        if (title.length > 200) {
            return res.status(400).json({ 
                success: false, 
                message: "Title must be less than 200 characters" 
            });
        }

        if (description.length > 2000) {
            return res.status(400).json({ 
                success: false, 
                message: "Description must be less than 2000 characters" 
            });
        }

    
        const [newPost] = await db
            .insert(posts)
            .values({
                title: title.trim(),
                description: description.trim(),
                currentLikes: 0,
                createdAt: new Date(),
                createdBy: req.session.userId  
            })
            .returning({
                postId: posts.postId,
                title: posts.title,
                description: posts.description,
                createdAt: posts.createdAt
            });

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: newPost
        });

    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to create post",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get("/create", (req, res) => {
    res.render("posts/create")
})

router.post('/like/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid post ID format' 
        });
    }

    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        const result = await db.transaction(async (tx) => {
            const [post] = await tx
                .select()
                .from(posts)
                .where(eq(posts.postId, id))
                .limit(1);

            if (!post) {
                throw new Error('POST_NOT_FOUND');
            }

            const [existingLike] = await tx
                .select()
                .from(likes)
                .where(
                    and(
                        eq(likes.postId, id),
                        eq(likes.likedBy, userId)
                    )
                )
                .limit(1);

            if (existingLike) {
                throw new Error('ALREADY_LIKED');
            }

            await tx
                .insert(likes)
                .values({
                    postId: id,
                    likedBy: userId,
                });

            await tx
                .update(posts)
                .set({ currentLikes: post.currentLikes + 1 })
                .where(eq(posts.postId, id));

            return { updatedLikes: post.currentLikes + 1 };
        });

        return res.json({
            success: true,
            message: 'Post liked successfully',
            likes: result.updatedLikes
        });

    } catch (error) {
        console.error('Like operation failed:', error);
        
        if (error.message === 'POST_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        if (error.message === 'ALREADY_LIKED') {
            return res.status(409).json({
                success: false,
                message: 'You have already liked this post'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to like post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.post('/unlike/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid post ID format' 
        });
    }

    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        const result = await db.transaction(async (tx) => {
            const [post] = await tx
                .select()
                .from(posts)
                .where(eq(posts.postId, id))
                .limit(1);

            if (!post) {
                throw new Error('POST_NOT_FOUND');
            }
            const [existingLike] = await tx
                .select()
                .from(likes)
                .where(
                    and(
                        eq(likes.postId, id),
                        eq(likes.likedBy, userId)
                    )
                )
                .limit(1);

            if (!existingLike) {
                throw new Error('LIKE_NOT_FOUND');
            }
            await tx
                .delete(likes)
                .where(
                    and(
                        eq(likes.postId, id),
                        eq(likes.likedBy, userId)
                    )
                );

            await tx
                .update(posts)
                .set({ currentLikes: post.currentLikes - 1 })
                .where(eq(posts.postId, id));

            return { updatedLikes: post.currentLikes - 1 };
        });

        return res.json({
            success: true,
            message: 'Post unliked successfully',
            likes: result.updatedLikes
        });

    } catch (error) {
        console.error('Unlike operation failed:', error);
        
        if (error.message === 'POST_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        if (error.message === 'LIKE_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                message: 'You have not liked this post'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to unlike post',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.delete('/:postId', async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.session.userId;

    try {
        const [post] = await db
            .select()
            .from(posts)
            .where(eq(posts.postId, postId))
            .limit(1);

        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        if (post.createdBy !== userId) {
            return res.status(403).json({ message: "You can only delete your own posts." });
        }

        await db.delete(posts).where(eq(posts.postId, postId));
        res.json({ message: "Post successfully deleted." });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Failed to delete post." });
    }
});

module.exports = router;