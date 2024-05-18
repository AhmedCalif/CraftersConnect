const express = require('express');
const router = express.Router();
const { Chat, User } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');

// Route to get all chat messages
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const chats = await Chat.findAll({
      include: {
        model: User,
        as: 'Sender',
        attributes: ['username']
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Route to post a new chat message
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.session.userId;

    console.log('Received message:', message);
    console.log('User ID:', userId);

    // Ensure message and userId are provided
    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }

    const newChat = await Chat.create({ message, userId });
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
