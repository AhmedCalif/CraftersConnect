const express = require('express');
const router = express.Router();
const { User, Project, Collaborator, Avatar, Image } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');

// Route for projects created by the user
router.get("/created", ensureAuthenticated, async (req, res) => {
  const user = await User.findOne({
    where: { username: req.session.username },
    include: Avatar
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  const projects = await Project.findAll({
    where: { userId: user.userId },
    include: [
      { model: User, as: 'Creator', include: Avatar },
      { model: Image }
    ]
  });

  res.render('userProjects/created', { projects, user });
});

// Route for projects where the user is a collaborator
router.get("/collaborated", ensureAuthenticated, async (req, res) => {
  const user = await User.findOne({
    where: { username: req.session.username },
    include: Avatar
  });

  if (!user) {
    return res.status(404).send("User not found");
  }

  const projects = await Project.findAll({
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

  res.render('userProjects/collaborated', { projects, user });
});

// Route for all projects related to the user
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
        { model: Image }
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
        { model: Image }
      ]
    });

    const allProjects = [...createdProjects, ...collaboratedProjects].filter((project, index, self) => 
      index === self.findIndex((p) => p.projectId === project.projectId)
    );

    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

    const coverImage = Project.coverImage || 'https://via.placeholder.com/150';


    res.render('userProjects/all', { createdProjects, collaboratedProjects, allProjects, user, avatarUrl, loggedInUsername, coverImage });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error while fetching projects list.");
  }
});

module.exports = router;
