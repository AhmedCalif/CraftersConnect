const router = require('express').Router();
const {Message, User, Avatar} = require('../database/schema/schemaModel');

router.get('/', async (req, res) => {
    if (!req.session.userId) {
      return res.status(403).json({ message: "Not logged in" });
    }
  
    try {
      const userId = req.session.userId;
      const messages = await Message.findAll({
        where: {
          [Sequelize.Op.or]: [{ userId }, { receiverId: userId }]
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['username'],
          include: [{ model: Avatar }] 
        }],
        order: [['createdAt', 'DESC']]
      });
  
      const chats = messages.map(message => ({
        username: message.User.username,
        lastMessage: message.message,
        userId: message.userId,
        avatarUrl: message.User.Avatar ? message.User.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3'
      }));
      
      res.render("chat/chat", {chats: chats, userId: userId})
    } catch (error) {
      res.status(500).json({ error: error.message });
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
        order: [['createdAt', 'ASC']]
      });
  
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  router.post('/chat/:receiverId/send', async (req, res) => {
    if (!req.session.userId) {
      return res.status(403).json({ message: "Not logged in" });
    }
  
    try {
      const { message } = req.body;
      const userId = req.session.userId;
      const receiverId = req.params.receiverId;
  
      const newMessage = await Message.create({
        message,
        userId,
        receiverId
      });
  
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  


module.exports = router;
