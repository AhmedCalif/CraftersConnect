const router = require('express').Router();
const { User, Post, Project, Avatar, Step, Image } = require('../database/schema/schemaModel');
const { ensureAuthenticated } = require('../middleware/middleware');

router.get('/dashboard', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }
    const user = await User.findOne({ where: { username: req.session.username } });
    if (!user) {
        return res.status(404).send("User not found");
    }

    const posts = await Post.findAll({
        include: [{
            model: User,
            as: 'creator',
            attributes: ['username'],
            include: [{
                model: Avatar,
                attributes: ['imageUrl']
            }]
        }]
    });
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
  
    
    const uniquePosts = [];
    const postIds = new Set();
    posts.forEach(post => {
        if (!postIds.has(post.postId)) {
            uniquePosts.push(post);
            postIds.add(post.postId);
        }
    });

    const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

    const userProjects = await Project.findAll({
        where: { userId: user.userId }
    });

   
    const newProjects = await Project.findAll({
        limit: 5, 
        order: [['createdAt', 'DESC']],
        include: [
            { model: User, as: 'Creator', include: Avatar },
            { model: Image }
        ]
    });

    res.render('home/dashboard', {
        user: user,
        posts: uniquePosts,
        projects: userProjects,
        newProjects: newProjects,
        avatarUrl: avatarUrl,
        allProjects
    });
});

router.post('/dashboard', async (req, res) => {
    const { title, description, steps } = req.body;
    try {
        const newProject = await Project.create({
            title,
            description,
            userId: req.session.userId 
        });
        const projectSteps = steps.map(stepDescription => ({
            description: stepDescription,
            projectId: newProject.projectId
        }));
        await Step.bulkCreate(projectSteps);

        console.log(newProject);
        res.redirect('/dashboard');
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).send("Failed to create project");
    }
});


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
