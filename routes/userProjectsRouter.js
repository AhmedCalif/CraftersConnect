const express = require('express');
const router = express.Router();
const { User, Project, Collaborator, Avatar } = require('../database/schema/schemaModel');
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
    include: { model: User, as: 'Creator', include: Avatar }
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
    include: {
      model: User,
      as: 'Collaborators',
      where: { userId: user.userId },
      include: [{ model: Avatar }]
    }
  });

  res.render('userProjects/collaborated', { projects, user });
});

// Route for all projects related to the user
router.get("/all", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { username: req.session.username },
      include: Avatar
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const createdProjects = await Project.findAll({ 
      where: { userId: user.userId }, 
    });

    const projects = await Project.findAll({
      include: [
        {
          model: User, 
          as: 'Creator', 
          include: Avatar,
          where: { userId: user.userId }
        },
        {
          model: User,
          as: 'Collaborators',
          through: { attributes: [] },
          where: { userId: user.userId }
        }
      ]
    });

    const collaboratedProjects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'Collaborators',
          where: {userId: user.userId }
        },
        {model: Step, as: 'Steps' },
        {model: User, include: Avatar }
      ]
    });

    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

    res.render('userProjects/all', { createdProjects, projects, user, avatarUrl, collaboratedProjects });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error while fetching projects list.");
    }
  });

module.exports = router;
