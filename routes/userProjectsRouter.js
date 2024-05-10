const express = require('express');
const { User, Project, Step, Image, Avatar } = require('../database/schema/schemaModel');
const router = express.Router();

// View projects created by the logged-in user
router.get("/", async (req, res) => {
  try {
    const username = req.session.username;
    if (!username) {
      return res.status(401).send("Unauthorized: No session available");
    }

    const user = await User.findOne({ where: { username: username }, include: Avatar });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const createdProjects = await Project.findAll({ 
      where: { userId: user.userId }, 
      include: [
        { model: Step, as: 'Steps' },
        { model: User, include: Avatar }  // Include the User model
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

    const projects = [...createdProjects, ...collaboratedProjects];

    res.render('userProjects/list', { projects, user, avatar: user.Avatar });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error while fetching user's projects");
  }
});

module.exports = router;
