// chatRoute.js
const express = require('express');
const { db } = require('../database/databaseConnection.js');
const { chats, users, likeChats } = require('../database/schema/schemaModel.js')
const { eq, and } = require('drizzle-orm');
const { ensureAuthenticated } = require('../middleware/middleware.js');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const router = express.Router();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Get all chat messages for a specific project
router.get('/:projectId', ensureAuthenticated, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const chatMessages = await db.select({
            chatId: chats.chatId,
            message: chats.message,
            userId: chats.userId,
            projectId: chats.projectId,
            createdAt: chats.createdAt,
            username: users.username
        })
        .from(chats)
        .leftJoin(users, eq(chats.userId, users.userId))
        .where(eq(chats.projectId, projectId))
        .orderBy(chats.createdAt);

        res.json(chatMessages);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).send('Server Error');
    }
});

// Post a new chat message
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { message, projectId } = req.body;
        const userId = req.session.userId;

        if (!message || !projectId || !userId) {
            return res.status(400).json({ error: 'Message, projectId, and userId are required' });
        }

        // Sanitize the message
        const sanitizedMessage = DOMPurify.sanitize(message);

        // Create new chat message
        const [newChat] = await db.insert(chats)
            .values({
                message: sanitizedMessage,
                projectId,
                userId
            })
            .returning();

        // Get chat with user details
        const chatWithUser = await db.select({
            chatId: chats.chatId,
            message: chats.message,
            userId: chats.userId,
            projectId: chats.projectId,
            createdAt: chats.createdAt,
            username: users.username
        })
        .from(chats)
        .leftJoin(users, eq(chats.userId, users.userId))
        .where(eq(chats.chatId, newChat.chatId))
        .get();

        res.json(chatWithUser);
    } catch (error) {
        console.error('Error saving chat message:', error);
        res.status(500).send('Server Error');
    }
});

// Like a chat message
router.post('/:chatId/like', ensureAuthenticated, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.session.userId;

    try {
        const chat = await db.select()
            .from(chats)
            .where(eq(chats.chatId, chatId))
            .get();

        if (!chat) {
            return res.status(404).json({ error: 'Chat message not found' });
        }

        const existingLike = await db.select()
            .from(likeChats)
            .where(and(
                eq(likeChats.chatId, chatId),
                eq(likeChats.userId, userId)
            ))
            .get();

        if (existingLike) {
            return res.status(400).json({ error: 'Chat message already liked by user' });
        }

        await db.insert(likeChats)
            .values({ chatId, userId });

        res.json({ chatId, liked: true });
    } catch (error) {
        console.error('Error liking chat message:', error);
        res.status(500).send('Server Error');
    }
});

// Unlike a chat message
router.post('/:chatId/unlike', ensureAuthenticated, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.session.userId;

    try {
        const chat = await db.select()
            .from(chats)
            .where(eq(chats.chatId, chatId))
            .get();

        if (!chat) {
            return res.status(404).json({ error: 'Chat message not found' });
        }

        const result = await db.delete(likeChats)
            .where(and(
                eq(likeChats.chatId, chatId),
                eq(likeChats.userId, userId)
            ))
            .run();

        if (result.changes === 0) {
            return res.status(400).json({ error: 'Chat message not liked by user' });
        }

        res.json({ chatId, unliked: true });
    } catch (error) {
        console.error('Error unliking chat message:', error);
        res.status(500).send('Server Error');
    }
});

// Delete a chat message
router.delete('/:chatId/delete', ensureAuthenticated, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.session.userId;

    try {
        const chat = await db.select()
            .from(chats)
            .where(eq(chats.chatId, chatId))
            .get();

        if (!chat) {
            return res.status(404).json({ error: 'Chat message not found' });
        }

        if (chat.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete chat message' });
        }

        await db.delete(chats)
            .where(eq(chats.chatId, chatId))
            .run();

        res.json({ message: 'Chat message deleted' });
    } catch (error) {
        console.error('Error deleting chat message:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;