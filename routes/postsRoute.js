const express = require('express');
const { eq, and } = require('drizzle-orm');
const { db } = require('../database/databaseConnection.js');
const { posts, users, likes, avatars } = require('../database/schema/schemaModel.js')

const router = express.Router();


router.get('/', async (req, res) => {
    console.log("Session Username:", req.session.username);
    try {
        if (!req.session.username) {
            return res.status(403).send("You must be logged in to view posts");
        }

        // Find user with avatar
        const [user] = await db
            .select({
                userId: users.userId,
                username: users.username,
                avatarUrl: avatars.imageUrl
            })
            .from(users)
            .where(eq(users.username, req.session.username))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .limit(1);

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get all posts with creators and their avatars
        let postsData = [];
        try {
            postsData = await db
                .select({
                    postId: posts.postId,
                    title: posts.title,
                    description: posts.description,
                    currentLikes: posts.currentLikes,
                    createdAt: posts.createdAt,
                    creatorId: users.userId,
                    creatorName: users.username,
                    creatorAvatar: avatars.imageUrl
                })
                .from(posts)
                .leftJoin(users, eq(posts.createdBy, users.userId))
                .leftJoin(avatars, eq(users.userId, avatars.userId));
        } catch (error) {
            console.error('Error fetching posts:', error);
            // Continue with empty posts array instead of failing
            postsData = [];
        }

        // Get user's likes if there are posts
        let likedPostIds = new Set();
        if (postsData.length > 0) {
            try {
                const userLikes = await db
                    .select({
                        postId: likes.postId
                    })
                    .from(likes)
                    .where(eq(likes.userId, user.userId));
                
                likedPostIds = new Set(userLikes.map(like => like.postId));
            } catch (error) {
                console.error('Error fetching likes:', error);
                // Continue with empty likes set
            }
        }

        // Process posts
        const processedPosts = postsData.map(post => ({
            postId: post.postId,
            title: post.title,
            description: post.description,
            currentLikes: post.currentLikes,
            createdAt: post.createdAt,
            creator: {
                userId: post.creatorId,
                username: post.creatorName,
                avatar: {
                    imageUrl: post.creatorAvatar || 'https://i.pravatar.cc/150?img=3'
                }
            },
            isLiked: likedPostIds.has(post.postId)
        }));

        // Always render the page, even with empty posts
        res.render('posts/posts', {
            posts: processedPosts,
            avatarUrl: user.avatarUrl || 'https://i.pravatar.cc/150?img=3',
            username: user.username,
            currentUser: { userId: user.userId }
        });

    } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Render the page with empty data instead of sending error
        res.render('posts/posts', {
            posts: [],
            avatarUrl: 'https://i.pravatar.cc/150?img=3',
            username: req.session.username,
            currentUser: { userId: req.session.userId }
        });
    }
});;

router.post("/create", async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Validate user is logged in
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
        return res.status(404).json({ message: 'Invalid ID' });
    }

    try {
        const [post] = await db
            .select()
            .from(posts)
            .where(eq(posts.postId, id))
            .limit(1);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const username = req.session.username;
        const userId = req.session.userId;
        if (!username || !userId) {
            return res.status(403).json({ message: 'You must be logged in to like posts' });
        }

        const [existingLike] = await db
            .select()
            .from(likes)
            .where(
                and(
                    eq(likes.postId, id),
                    eq(likes.userId, userId)
                )
            )
            .limit(1);

        if (existingLike) {
            return res.status(409).json({ message: 'User has already liked this post' });
        }

        await db.transaction(async (tx) => {
            await tx.insert(likes).values({
                postId: id,
                userId: userId,
                likedBy: username
            });

            await tx
                .update(posts)
                .set({ currentLikes: post.currentLikes + 1 })
                .where(eq(posts.postId, id));
        });

        res.json({
            message: 'Post successfully liked',
            likes: post.currentLikes + 1
        });
    } catch (error) {
        console.error('Failed to like post:', error);
        res.status(500).json({ message: 'Error liking post' });
    }
});

router.post('/unlike/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(404).json({ message: 'Invalid ID' });
    }

    try {
        const [post] = await db
            .select()
            .from(posts)
            .where(eq(posts.postId, id))
            .limit(1);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const [existingLike] = await db
            .select()
            .from(likes)
            .where(
                and(
                    eq(likes.postId, id),
                    eq(likes.userId, req.session.userId)
                )
            )
            .limit(1);

        if (!existingLike) {
            return res.status(404).json({ message: 'Like not found' });
        }

        await db.transaction(async (tx) => {
            await tx
                .delete(likes)
                .where(
                    and(
                        eq(likes.postId, id),
                        eq(likes.userId, req.session.userId)
                    )
                );

            await tx
                .update(posts)
                .set({ currentLikes: post.currentLikes - 1 })
                .where(eq(posts.postId, id));
        });

        res.json({ likes: post.currentLikes - 1 });
    } catch (error) {
        console.error('Failed to unlike post:', error);
        res.status(500).json({ message: 'Failed to unlike post' });
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