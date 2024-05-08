const router = require('express').Router();
const { User, Post, Project, Avatar } = require('../database/schema/schemaModel');

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
            include: [{
                model: Avatar,
                attributes: ['imageUrl']
            }]
        }]
    });

    const postsWithAvatars = posts.map(post => ({
        ...post.toJSON(),
        avatar: post.creator && post.creator.Avatar ? post.creator.Avatar.imageUrl : 'default-avatar.jpg'
    }));
    


    const userProjects = await Project.findAll({
        where: { userId: user.userId }
    });

    res.render('home/dashboard', {
        user: user,
        posts: postsWithAvatars,
        projects: userProjects
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

module.exports = router;
