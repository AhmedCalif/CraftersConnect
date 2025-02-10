// chatRoute.js
const express = require('express');
const { db } = require('../database/databaseConnection.js');
const { chats, users, likeChats } = require('../database/schema/schemaModel.js');
const { eq, and } = require('drizzle-orm');
const { ensureAuthenticated } = require('../middleware/middleware.js');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const router = express.Router();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


router.setSocketIO = function(socketIO) {
    io = socketIO;
};


router.get('/:projectId', ensureAuthenticated, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const chatMessages = await db.select({
            chatId: chats.chatId,
            message: chats.message,
            userId: chats.userId,
            projectId: chats.projectId,
            createdAt: chats.createdAt,
            username: users.username,
        })
        .from(chats)
        .leftJoin(users, eq(chats.userId, users.userId))
        .where(eq(chats.projectId, projectId))
        .orderBy(chats.createdAt);

        const messagesWithLikes = await Promise.all(chatMessages.map(async (chat) => {
            const likes = await db.select()
                .from(likeChats)
                .where(eq(likeChats.chatId, chat.chatId));
            
            return {
                ...chat,
                likes: likes.length,
                isLiked: likes.some(like => like.userId === req.session.userId)
            };
        }));

        res.json(messagesWithLikes);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { message, projectId } = req.body;
        const userId = req.session.userId;

        if (!message?.trim() || !projectId || !userId) {
            return res.status(400).json({ error: 'Message, projectId, and userId are required' });
        }

        const sanitizedMessage = DOMPurify.sanitize(message);

        const [newChat] = await db.insert(chats)
            .values({
                message: sanitizedMessage,
                projectId: Number(projectId),
                userId
            })
            .returning();

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

        

        if (io) {
            io.to(chats.projectId.toString()).emit('chat message', chatWithUser);
        }


        res.json(chatWithUser);
    } catch (error) {
        console.error('Error saving chat message:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

router.post('/:chatId/like', ensureAuthenticated, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.session.userId;

    try {
        const chat = await db.select()
            .from(chats)
            .where(eq(chats.chatId, Number(chatId)))
            .get();

        if (!chat) {
            return res.status(404).json({ error: 'Chat message not found' });
        }

        const existingLike = await db.select()
            .from(likeChats)
            .where(and(
                eq(likeChats.chatId, Number(chatId)),
                eq(likeChats.userId, userId)
            ))
            .get();

        if (existingLike) {
            return res.status(400).json({ error: 'Message already liked' });
        }

        await db.insert(likeChats)
            .values({ chatId: Number(chatId), userId });

        res.json({ success: true, chatId, action: 'liked' });
    } catch (error) {
        console.error('Error liking chat message:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

router.post('/:chatId/unlike', ensureAuthenticated, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.session.userId;

    try {
        const chat = await db.select()
            .from(chats)
            .where(eq(chats.chatId, Number(chatId)))
            .get();

        if (!chat) {
            return res.status(404).json({ error: 'Chat message not found' });
        }

        const result = await db.delete(likeChats)
            .where(and(
                eq(likeChats.chatId, Number(chatId)),
                eq(likeChats.userId, userId)
            ))
            .run();

        if (result.changes === 0) {
            return res.status(400).json({ error: 'Message not liked' });
        }

        res.json({ success: true, chatId, action: 'unliked' });
    } catch (error) {
        console.error('Error unliking chat message:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

router.delete('/:chatId/delete', ensureAuthenticated, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.session.userId;

    try {
        const chat = await db.select()
            .from(chats)
            .where(eq(chats.chatId, Number(chatId)))
            .get();

        if (!chat) {
            return res.status(404).json({ error: 'Chat message not found' });
        }

        if (chat.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this message' });
        }

        await db.delete(chats)
            .where(eq(chats.chatId, Number(chatId)))
            .run();

        if (io) {
            io.to(chat.projectId.toString()).emit('chat deleted', chatId);
        }

        res.json({ success: true, message: 'Chat message deleted' });
    } catch (error) {
        console.error('Error deleting chat message:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;