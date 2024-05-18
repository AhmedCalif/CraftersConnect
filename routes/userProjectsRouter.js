const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const { User, Project, Step, Image, Avatar, Collaborator } = require('../database/schema/schemaModel');
const { ensureAuthenticated, uploadMiddleware } = require('../middleware/middleware');
const Sequelize = require('sequelize');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const fileExtension = path.extname(file.originalname).substring(1);
    const publicId = `${req.session.userId}-${file.fieldname}-${Date.now()}`;
    return {
      folder: 'uploads',
      public_id: publicId,
      format: fileExtension,
      overwrite: true,
    };
  },
});

const upload = uploadMiddleware('/uploads');

// Route to create a new project
router.post("/create", ensureAuthenticated, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, description, steps, date } = req.body;
    const user = await User.findOne({ where: { username: req.session.username }});
    const coverImage = req.file ? req.file.path : null;

    console.log('File uploaded:', req.file); // Log the file details

    if (!user) {
      console.error("User not found");
      return res.status(400).send("User not found");
    }

    const newProject = await Project.create({
      title,
      description,
      userId: user.userId,
      date,
      createdAt: date,
      updatedAt: date
    });

    console.log('New Project:', newProject);

    if (coverImage) {
      const newImage = await Image.create({
        link: coverImage,
        projectId: newProject.projectId
      });
      console.log('New Image:', newImage);
    } else {
      console.log('No cover image provided');
    }

    if (steps && steps.length) {
      const stepRecords = steps.map(step => ({
        description: step,
        projectId: newProject.projectId
      }));
      await Step.bulkCreate(stepRecords);
    }

    res.redirect(`/projects/${newProject.projectId}`);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).send("Failed to create project. Please try again.");
  }
});
// Route for projects created by the user
router.get("/created", ensureAuthenticated, async (req, res) => {
  const loggedInUsername = req.session.username;
  const user = await User.findOne({
    where: { username: req.session.username },
    include: Avatar
  });
  
  if (!user) {
    return res.status(404).send("User not found");
  }

  const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
  
  const createdProjects = await Project.findAll({ 
    where: { userId: user.userId }, 
    include: [{ model: User, as: 'Creator', include: Avatar}, {model: Image }],
    distinct: true
    
  });

  res.render('userProjects/created', { createdProjects, user, loggedInUsername, avatarUrl });
});

// Route for projects where the user is a collaborator
router.get("/collaborated", ensureAuthenticated, async (req, res) => {
  const loggedInUsername = req.session.username;
  const user = await User.findOne({
    where: { username: req.session.username },
    include: Avatar
  });
  
  if (!user) {
    return res.status(404).send("User not found");
  }
  const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

  const collaboratedProjects = await Project.findAll({
    include: [
      {
        model: User,
        as: 'Collaborators',
        where: { userId: user.userId },
        include: [{ model: Avatar }]
      },
      { model: User, as: 'Creator', include: Avatar },
      { model: Image }
    ]
  });

  res.render('userProjects/collaborated', { collaboratedProjects, user, avatarUrl, loggedInUsername });
});

// Route to view all projects
// Route to view all projects
router.get("/all", ensureAuthenticated, async (req, res) => {
  try {
    const loggedInUsername = req.session.username;
    const user = await User.findOne({
      where: { username: req.session.username },
      include: Avatar
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const createdProjects = await Project.findAll({
      where: { userId: user.userId },
      include: [
        { model: User, as: 'Creator', include: Avatar },
        { model: Image }  // Ensure Image is included
      ],
      distinct: true
    });

    const collaboratedProjects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'Collaborators',
          where: { userId: user.userId },
          include: [{ model: Avatar }]
        },
        { model: User, as: 'Creator', include: Avatar },
        { model: Image }  // Ensure Image is included
      ]
    });

    const allProjects = [...createdProjects, ...collaboratedProjects].filter((project, index, self) =>
      index === self.findIndex((p) => p.projectId === project.projectId)
    );

    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

    console.log("All Projects:", allProjects);
    res.render('userProjects/all', {
      allProjects,
      createdProjects,
      collaboratedProjects,
      user,
      avatarUrl,
      loggedInUsername
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error while fetching projects list.");
  }
});

module.exports = router;
