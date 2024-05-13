const router = require('express').Router();
const Sequelize = require('sequelize');
const {Message, User, Avatar} = require('../database/schema/schemaModel');

router.get('/', async (req, res) => {
    if (!req.session.userId) {
      return res.status(403).json({ message: "Not logged in" });
    }
  
    try {
      const userId = req.session.userId;
      const messages = await Message.findAll({
        where: {
          userId: userId
        },
        include: [{
          model: User,
          attributes: ['username'],
          include: [{
            model: Avatar,
            attributes: ['imageUrl']
          }]
        }],
        order: [['createdAt', 'DESC']]
      });

      const chats = messages.map(message => ({
        username: message.User.username,
        lastMessage: message.message,
        userId: message.userId,
        avatarUrl: message.User.Avatar ? message.User.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3'
    }));
      
      res.render("chat/chat", {chat: chats, userId: userId});
    } catch (error) {
      console.error(error.stack);
      res.status(500).json('Error fetching messages');
    }
});


router.post('/', async (req, res) => {
    const username = req.session.username;
    const messageText = req.body.message;

    if (!username || !messageText) {
        return res.status(400).send('Username and message are required');
    }

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const newMessage = await Message.create({
            message: messageText,
            userId: user.userId  
        });

        const allUsers = await User.findAll({
            attributes: ['username'],
            raw: true
        });
        const messages = await Message.findAll({
            include: [{
                model: User,
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']]  
        });

        const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

        console.log("message:", newMessage);    
        res.render('chat/chat', {
            messages: messages,
            users: allUsers,
            username: username,
            avatarUrl: avatarUrl
        });
    } catch (error) {
        console.error('Failed to save message:', error);
        res.status(500).send('Error saving message');
    }
});

router.get('/chat/:userId', async (req, res) => {
  if (!req.session.userId) {
      return res.status(403).json({ message: "Not logged in" });
  }

  try {
      const otherUserId = req.params.userId;
      const userId = req.session.userId;

      const messages = await Message.findAll({
          where: {
              [Sequelize.Op.or]: [
                  { userId, receiverId: otherUserId },
                  { userId: otherUserId, receiverId: userId }
              ]
          },
          include: [{
              model: User,
              attributes: ['username'],
              where: { userId: otherUserId }
          }],
          order: [['createdAt', 'ASC']]
      });

      res.render("chat/conversation", { messages: messages, otherUser: otherUserId });
  } catch (error) {
      console.error("Failed to load chat:", error);
      res.status(500).json({ error: error.message });
  }
});



router.post('/chat/:userId/send', async (req, res) => {
    if (!req.session.userId) {
        return res.status(403).json({ message: "Not logged in" });
    }
  
    const receiverId = req.params.userId;
    const userId = req.session.userId;
    const { message } = req.body;
  
    try {
        const newMessage = await Message.create({
            message,
            userId,
            receiverId
        });

        console.log("newMessage:", newMessage);
  
        res.redirect(`/chat/${receiverId}`);
    } catch (error) {
        console.error("Failed to send message:", error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
