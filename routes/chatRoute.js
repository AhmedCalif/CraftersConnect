const express = require('express');
const { Message, User, Avatar } = require('../database/schema/schemaModel');
const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).json({ message: "Not logged in" });
  }

  try {
    const userId = req.session.userId;
    const messages = await Message.findAll({
      where: {
        [Sequelize.Op.or]: [
          { userId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['username'],
          include: [{
            model: Avatar,
            attributes: ['imageUrl']
          }]
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['username'],
          include: [{
            model: Avatar,
            attributes: ['imageUrl']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const chats = messages.map(message => ({
      senderUsername: message.Sender.username,
      receiverUsername: message.Receiver.username,
      lastMessage: message.message,
      userId: message.userId,
      receiverId: message.receiverId,
      senderAvatarUrl: message.Sender.Avatar ? message.Sender.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3',
      receiverAvatarUrl: message.Receiver.Avatar ? message.Receiver.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3'
    }));

    res.json({ chats: chats, userId: userId });
  } catch (error) {
    console.error(error.stack);
    res.status(500).json('Error fetching messages');
  }
});

router.post('/', async (req, res) => {
    const username = req.session.username;
    const messageText = req.body.message;
    const receiverId = req.body.receiverId;
  
    if (!username || !messageText || !receiverId) {
      return res.status(400).send('Username, message, and receiver ID are required');
    }
  
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      const newMessage = await Message.create({
        message: messageText,
        userId: user.userId,
        receiverId: receiverId
      });
  
      const messages = await Message.findAll({
        include: [{
          model: User,
          as: 'Sender',
          attributes: ['username']
        }],
        order: [['createdAt', 'DESC']]  
      });
  
      const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
  
      res.json({ 
        newMessage: newMessage,
        messages: messages,
        avatarUrl: avatarUrl 
      });
    } catch (error) {
      console.error('Failed to save message:', error);
      res.status(500).send('Error saving message');
    }
  });
  
module.exports = router;
