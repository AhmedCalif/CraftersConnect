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
            .select()
            .from(users)
            .where(eq(users.username, req.session.username))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .limit(1);

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get all posts with creators and their avatars
        const postsData = await db
            .select()
            .from(posts)
            .leftJoin(users, eq(posts.createdBy, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId));

        // Get user's likes
        const userLikes = await db
            .select()
            .from(likes)
            .where(eq(likes.userId, user.userId));

        const likedPostIds = new Set(userLikes.map(like => like.postId));

        // Process posts
        const avatarUrl = user.avatars?.imageUrl ?? 'https://i.pravatar.cc/150?img=3';
        const uniquePosts = [];
        const postIds = new Set();

        for (const post of postsData) {
            if (!postIds.has(post.posts.postId)) {
                uniquePosts.push({
                    ...post.posts,
                    creator: {
                        userId: post.users.userId,
                        username: post.users.username,
                        avatar: {
                            imageUrl: post.avatars?.imageUrl
                        }
                    },
                    isLiked: likedPostIds.has(post.posts.postId)
                });
                postIds.add(post.posts.postId);
            }
        }

        res.render('posts/posts', {
            posts: uniquePosts,
            avatarUrl,
            username: user.users.username,
            currentUser: { userId: user.users.userId }
        });

    } catch (error) {
        console.error('Failed to fetch posts:', error);
        res.status(500).send("Error fetching posts");
    }
});

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