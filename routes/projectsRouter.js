const express = require("express");
const router = express.Router();
const db = require("../models/projectModel");
const { users } = require("../models/userModel");

const sessionUser = null;

//view all
router.get("/", (req, res) => {
  try {
    console.log("Session Username:", req.session.username);  
    const user = users.find(user => user.username === req.session.username);
    console.log("Found User:", user); 
    if (!user) {
        return res.status(404).send("User not found");  
    }
    const projects = db.getAllProjects();
    res.render('projects/list', { projects: projects, user: user, avatar: user.avatar});  
  } catch {
    console.error(err);
    res.status(500).send("Server Error while fetching projects list.");
  }
});




//route to add a new project
router.get("/create", (req, res) => {
  res.render("projects/create", {username: req.session.username});
});


router.post("/create", (req, res) => {
  try {
    const { username, title, description, steps } = req.body;
    const newProject = db.addProject(username, title, description, steps);
    console.log("New Form Created:", req.body);
    res.redirect("/projects");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create project. Please try again.");
  }
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const project = db.getProjectById(id);
  if (project) {
    res.render('projects/show', { project } );
  } else {
    res.status(404).json({ message: "Project not found" });
  }
});

//update project
router.get('/:id/update', (req, res) => {
    const id = parseInt(req.params.id);
    const project = projectModel.getProjectById(id);
    if (project) {
        res.render('projects/update', { project });
    } else {
        res.status(404).send("Project not found");
    }
});

router.post('/:id/update', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, date, steps } = req.body;
    const updatedProject = db.updateProject(id, { title, description, date, steps });
    if (updatedProject) {
        res.redirect(`/projects/${id}`);
    } else {
        res.status(404).send("Project not found");
    }
})


//delete project
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const success = db.deleteProject(id);
  if (success) {
    res.redirect("/projects");
  } else {
    res.status(404).json({ message: "Project not found" });
  }
});

module.exports = router;
