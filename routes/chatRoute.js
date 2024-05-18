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

    console.log('Received message:', message);
    console.log('Project ID:', projectId);
    console.log('User ID:', userId);

    // Ensure message, projectId, and userId are provided
    if (!message || !projectId || !userId) {
      return res.status(400).json({ error: 'Message, projectId, and userId are required' });
    }

    const newChat = await Chat.create({ message, projectId, userId });
    console.log('New chat created:', newChat);

    const chatWithUser = await Chat.findOne({
      where: { chatId: newChat.chatId },
      include: {
        model: User,
        as: 'Sender',
        attributes: ['username']
      }
    });

    console.log('Chat with user details:', chatWithUser);

    res.json(chatWithUser);
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
