const express = require('express');
const router = express.Router();
const { Chat, User, Project } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');

// Route to get all chat messages for a specific project
router.get('/:projectId', ensureAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const chats = await Chat.findAll({
      where: { projectId },
      include: {
        model: User,
        as: 'Sender',
        attributes: ['username']
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).send('Server Error');
  }
});

// Route to post a new chat message for a specific project
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { message, projectId } = req.body;
    const userId = req.session.userId;

    if (!message || !projectId || !userId) {
      return res.status(400).json({ error: 'Message, projectId, and userId are required' });
    }

    const newChat = await Chat.create({ message, projectId, userId });

    const chatWithUser = await Chat.findOne({
      where: { chatId: newChat.chatId },
      include: {
        model: User,
        as: 'Sender',
        attributes: ['username']
      }
    });

    res.json(chatWithUser);
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).send('Server Error');
  }
});

// Route to like a chat message
router.post('/:chatId/like', ensureAuthenticated, async (req, res) => {
  const { chatId } = req.params;
  const userId = req.session.userId;

  try {
    const chat = await Chat.findOne({ where: { chatId } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat message not found' });
    }

    const likedBy = chat.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      const index = likedBy.indexOf(userId);
      likedBy.splice(index, 1);
    } else {
      likedBy.push(userId);
    }

    await chat.update({ likedBy });

    res.json({ chatId, liked: !isLiked });
  } catch (error) {
    console.error('Error liking chat message:', error);
    res.status(500).send('Server Error');
  }
});

// Route to delete a chat message
router.delete('/:chatId/delete', ensureAuthenticated, async (req, res) => {
  const { chatId } = req.params;
  const userId = req.session.userId;

  try {
    const chat = await Chat.findOne({ where: { chatId } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat message not found' });
    }

    if (chat.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete chat message' });
    }

    await chat.destroy();
    res.json({ message: 'Chat message deleted' });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
