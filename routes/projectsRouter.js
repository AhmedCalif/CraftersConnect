const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const { User, Project, Step, Image, Avatar, Collaborator } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');
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

const upload = multer({ storage: storage });

router.post('/upload-coverImage', upload.single('coverImage'), async (req, res) => {
  try {
    const coverImage = req.file.path;
    if (!coverImage) {
      return res.status(400).json({ success: false, message: 'Image not uploaded' });
    }
    return res.status(200).json({ success: true, imageUrl: coverImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// View all projects
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { username: req.session.username },
      include: Avatar
    });
    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';
    if (!user) {
      return res.status(404).send("User not found");
    }

    const searchQuery = req.query.search || '';
    const sortOption = req.query.sort || '';
    let whereCondition = {};
    let order = [];

    if (searchQuery) {
      whereCondition.title = { [Sequelize.Op.like]: `%${searchQuery}%` };
    }

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
          model: Image
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
      searchQuery,
      sortOption
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
    const user = await User.findOne({ where: { username: req.session.username }});
    const coverImage = req.file ? req.file.path : null;

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

    if (coverImage) {
      await Image.create({
        link: coverImage,
        projectId: newProject.projectId
      });
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

    if (project) {
      const collaborators = project.Collaborators.map(collaborator => ({
        userId: collaborator.userId,
        username: collaborator.username,
        avatarUrl: collaborator.Avatar ? collaborator.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3'
      }));

      const avatarUrl = project.Creator.Avatar ? project.Creator.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

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

  try {
    const project = await Project.findOne({
      where: { projectId: id },
      include: [{ model: Step, as: 'Steps' }]
    });

    if (!project) {
      return res.status(404).send("Project not found");
    }

    await project.update({ title, description, updatedAt });

    await Step.destroy({ where: { projectId: id } });

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
