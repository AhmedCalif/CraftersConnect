const router = require('express').Router();
const { User, Post, Project, Avatar, Step } = require('../database/schema/schemaModel');

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

    res.render('home/dashboard', {
        user: user,
        posts: uniquePosts,
        projects: userProjects,
        avatarUrl: avatarUrl,
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
