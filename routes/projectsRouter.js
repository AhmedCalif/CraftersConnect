const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { User, Project, Step, Image, Avatar, Collaborator, Message } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');
const Sequelize = require('sequelize');
const router = express.Router();
const WebSocket = require('ws');
const { wss } = require('../server');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'project_covers',
    format: async (req, file) => 'png',
    public_id: (req, file) => Date.now() + '-' + file.originalname
  }
});

const upload = multer({ storage: storage });


function checkProjectOwnership(req, res, next) {
  Project.findByPk(req.params.projectId, {
    include: [{
      model: User,
      as: 'Creator'
    }]
  })
  .then(project => {
    if (!project) {
      return res.status(404).send('Project not found');
    }
    if (project.Creator.userId !== req.user.userId) {
      return res.status(403).send('You are not authorized to modify this project');
    }
    req.project = project; // pass project to the next middleware or route handler
    next();
  })
  .catch(error => {
    console.error(error);
    res.status(500).send("Server Error");
  });
}


// View all projects
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Session Username:", req.session.username);
    const user = await User.findOne({
      where: { username: req.session.username },
      include: Avatar
    });
    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
    console.log("Found User:", user);
    if (!user) {
      return res.status(404).send("User not found");  
    }

    const searchQuery = req.query.search || '';
    const sortOption = req.query.sort || '';
    let whereCondition = {};
    let order = [];

    // Applying search filtering
    if (searchQuery) {
      whereCondition.title = { [Sequelize.Op.like]: `%${searchQuery}%` };
    }

    // Applying sorting
    if (sortOption) {
      const [sortBy, sortOrder] = sortOption.split('_');
      order = [[sortBy, sortOrder]];
    }

    const projects = await Project.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'Creator',
          include: {
            model: Avatar,
            as: 'Avatar',
            required: false
          },
        },
  
        {
          model: User,
          as: 'Collaborators',
          through: { attributes: [] },
          include: { model: Avatar, required: false }
        }
      ],
      order: order
    });

    res.render('projects/list', {
      projects,
      username: req.session.username,
      avatar: avatarUrl,
      searchQuery, // Pass the current search query back to the view
      sortOption // Pass the current sort option back to the view
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error while fetching projects list.");
  }
});

// Route to add a new project
router.get("/create", ensureAuthenticated, (req, res) => {
  res.render("projects/create", { username: req.session.username });
});

router.post("/create", ensureAuthenticated, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, description, steps, date } = req.body;
    const username = await User.findOne({ where: { username: req.session.username }});
    const coverImage = req.file ? req.file.path : null; // URL of the uploaded image
    
    // Debugging statement to check the request body
    console.log("Form submission data:", req.body);
    console.log("Uploaded file:", req.file);
    
    // Check if the username is correctly passed
    if (!username) {
      console.error("Username not provided");
      return res.status(400).send("Username not provided");
    }
    
    // Create a new project with the timestamp
    const newProject = await Project.create({
      title,
      description,
      userId: username.userId,
      date, // Set the current timestamp as the date
      createdAt: date,
      updatedAt: date
    });
    
    // Create an image record and associate it with the project
    if (coverImage) {
      await Image.create({
        link: coverImage,
        projectId: newProject.projectId
      });
    }
    
    // Create steps if provided
    if (steps && steps.length) {
      const stepRecords = steps.map((step) => ({
        description: step,
        projectId: newProject.projectId
      }));
      await Step.bulkCreate(stepRecords);
    }
    
    // Debugging statement to confirm project creation
    console.log("New Project Created:", newProject);
    
    // Redirect to projects page after successful creation
    res.redirect(`/projects/${newProject.projectId}`);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).send("Failed to create project. Please try again.");
  }
});


router.get('/chat', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).json({ message: "Not logged in" });
  }

  try {
    const userId = req.session.userId;
    const projectId = req.query.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const project = await Project.findOne({
      where: { projectId },
      include: [
        { model: User, as: 'Collaborators', through: { attributes: [] }, include: [{ model: Avatar }] }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const collaborators = project.Collaborators.map(collaborator => ({
      userId: collaborator.userId,
      username: collaborator.username,
      avatarUrl: collaborator.Avatar ? collaborator.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3'
    }));

    const messages = await Message.findAll({
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['username'],
          include: [{ model: Avatar, attributes: ['imageUrl'] }]
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['username'],
          include: [{ model: Avatar, attributes: ['imageUrl'] }]
        }
      ],
      order: [['createdAt', 'ASC']]
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

    res.json({ chats: chats, collaborators: collaborators, userId: userId });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

router.post('/chat', async (req, res) => {
  const userId = req.session.userId; 
  const messageText = req.body.message;
  const receiverId = req.body.receiverId;
  const projectId = req.body.projectId; 

  if (!userId|| !messageText || !receiverId || !projectId) { 
    return res.status(400).json({ error: 'Username, message, receiver ID, and project ID are required' });
  }

  try {
    const user = await User.findOne({ where: { userId: userId } }); 
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const receiver = await User.findOne({ where: { userId: receiverId } });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const newMessage = await Message.create({
      message: messageText,
      userId: user.userId, 
      receiverId: receiver.userId, 
      projectId: projectId
    });

    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

    res.json({
      newMessage: {
        userId: user.userId,
        message: newMessage.message,
        avatarUrl: avatarUrl
      }
    });

    const messageData = {
      userId: user.userId,
      message: newMessage.message,
    };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        console.log('Broadcasting message:', messageData);
      }
    });

  } catch (error) {
    console.error('Failed to save message:', error);
  }
});


// View project details
router.get("/:id", ensureAuthenticated, async (req, res) => {
  const loggedInUsername = req.session.username;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const project = await Project.findOne({
      where: { projectId: id },
      include: [
        { model: Step, as: 'Steps' },
        { model: Image },
        {
          model: User,
          as: 'Creator',
          include: {
            model: Avatar,
            as: 'Avatar',
            required: false
          },
        },
        {
          model: User,
          as: 'Collaborators',
          through: { attributes: [] },
          include: { model: Avatar, required: false }
        }
      ]
    });
    const collaborators = project.Collaborators.map(collaborator => ({
      userId: collaborator.userId,
      username: collaborator.username,
      avatarUrl: collaborator.Avatar ? collaborator.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3'
    }));

    const avatarUrl = project.Creator.Avatar ? project.Creator.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
    if (project) {
      console.log('Project Details:', project);
      res.render('projects/show', { project, loggedInUsername, avatar: avatarUrl, collaborators });
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).send("Server Error while fetching project details.");
  }
}); 

// Update project
router.get('/:id/update', ensureAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const project = await Project.findOne({
      where: { projectId: id },
      include: [{ model: Step, as: 'Steps' }]
    });

    if (project) {
      res.render('projects/update', { project, username: req.session.username });
    } else {
      res.status(404).send("Project not found");
    }
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).send("Server Error while fetching project details.");
  }
});

router.post('/:id/update', ensureAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  const updatedAt = new Date();
  const { title, description, date, steps } = req.body;
  console.log("Update details:", req.body);

  try {
    const project = await Project.findOne({
      where: { projectId: id },
      include: [{ model: Step, as: 'Steps' }]
    });

    if (!project) {
      return res.status(404).send("Project not found");
    }

    await project.update({ title, description, steps, updatedAt });

    // Delete existing steps
    await Step.destroy({ where: { projectId: id } });

    // Add new steps
    if (steps && steps.length) {
      const stepRecords = steps.map(step => ({
        description: step.description,
        projectId: id
      }));
      await Step.bulkCreate(stepRecords);
    }

    res.redirect(`/projects/${id}`);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).send("Failed to update project. Please try again.");
  }
});

// Delete project
router.get("/:id/delete", ensureAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);
  const project = await Project.findOne({ where: { projectId: id } });
  if (project) {
    res.render("projects/delete", { project });
  } else {
    res.status(404).send("Project not found");
  }
});

router.post("/:id/delete", ensureAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);
  const success = await Project.destroy({ where: { projectId: id } });
  if (success) {
    res.redirect("/projects");
  } else {
    res.status(404).json({ message: "Project not found" });
  }
});

// Collaborators
// Join project
router.post('/:projectId/join', ensureAuthenticated, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const user = await User.findOne({ where: { username: req.session.username } });

    if (user) {
      await Collaborator.create({ projectId, userId: user.userId });
      console.log(`Collaborator added: ${user.username} to project ${projectId}`);
    }

    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('Error joining project:', err);
    res.status(500).send('Failed to join project.');
  }
});

// Leave project
router.post('/:projectId/leave', ensureAuthenticated, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const user = await User.findOne({ where: { username: req.session.username } });

    if (user) {
      await Collaborator.destroy({ where: { projectId, userId: user.userId } });
      console.log(`Collaborator removed: ${user.username} from project ${projectId}`);
    }

    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error('Error leaving project:', err);
    res.status(500).send('Failed to leave project.');
  }
});


module.exports = router;
