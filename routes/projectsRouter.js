const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { User, Project, Step, Image, Avatar, Collaborator } = require('../database/schema/schemaModel');
const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
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

// View all projects
router.get("/", async (req, res) => {
  try {
    
    console.log("Session Username:", req.session.username);  
    const user = await User.findOne({ where: { username: req.session.username }, include: Avatar });
    const avatar = user.avatar;
    console.log("Found User:", user); 
    if (!user) {
        return res.status(404).send("User not found");  
    }
    const projects = await Project.findAll({
      include: [
          {
              model: User,
              as: 'User',
              include: {
                  model: Avatar,
                  as: 'Avatar'
              }
          },
          {
              model: User,
              as: 'Collaborators',
              through: { attributes: [] } // This avoids including the join table attributes
          }
      ]
    });

    res.render('projects/list', { projects, username: req.session.username, avatar: avatar });  
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error while fetching projects list.");
  }
});

// Route to add a new project
router.get("/create", (req, res) => {
  res.render("projects/create", { username: req.session.username });
});

router.post("/create", upload.single('coverImage'), async (req, res) => {
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
    res.redirect("/projects");
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).send("Failed to create project. Please try again.");
  }
});



//View

router.get("/:id", async (req, res) => {
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
        { model: User, include: Avatar }
      ]
    });
    if (project) {
      console.log('Project Details:', project);
      res.render('projects/show', { project, loggedInUsername });
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).send("Server Error while fetching project details.");
  }
});



// Update project

router.get('/:id/update', async (req, res) => {
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

router.post('/:id/update', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

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

    await project.update({ title, description, date });

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
router.get("/:id/delete", async (req, res) => {
  const id = parseInt(req.params.id);
  const project = await Project.findOne({ where: { projectId: id } });
  if (project) {
    res.render("projects/delete", { project });
  } else {
    res.status(404).send("Project not found");
  }
});

router.post("/:id/delete", async (req, res) => {
  const id = parseInt(req.params.id);
  const success = await Project.destroy({ where: { projectId: id } });
  if (success) {
    res.redirect("/projects");
  } else {
    res.status(404).json({ message: "Project not found" });
  }
});




///collaborators

// Join project
router.post('/:projectId/join', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const user = await User.findOne({ where: { username: req.session.username } });

    // Add the user as a collaborator
    if (user) {
      await Collaborator.create({ projectId, userId: user.userId });
      console.log(`Collaborator added: ${user.username} to project ${projectId}`);
    }

    res.redirect('/projects');
} catch (err) {
    res.status(500).send(err.message);
}
});

// Leave project
router.post('/:projectId/leave', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const user = await User.findOne({ where: { username: req.session.username } });

    // Remove the user as a collaborator
    if (user) {
      console.log(`Collaborator removed: ${user.username} from project ${projectId}`);
      
      await Collaborator.destroy({ where: { projectId, userId: user.userId } });
    }

    res.redirect('/projects'); 
} catch (err) {
    res.status(500).send(err.message);
}
});

module.exports = router;

