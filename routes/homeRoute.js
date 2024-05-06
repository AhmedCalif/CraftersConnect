const router = require('express').Router();
const posts = require('../models/postModel');
const projects = require('../models/projectModel');
const {users} = require('../models/userModel');

router.get('/dashboard', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }
    const user = users.find(user => user.username === req.session.username);
    if (!user) {
        return res.status(404).send("User not found");
    }
    const postsWithAvatars = posts.map((post) => {
        const postCreator = users.find(user => user.username === post.createdBy);
        return {
            ...post,
            avatar: postCreator ? postCreator.avatar : 'default-avatar.jpg'
        };
    });
    const userProjects = projects.getAllProjects(user.username);
    res.render('home/dashboard', {
        user: user, 
        posts: postsWithAvatars,
        projects: userProjects
    });
});

router.post('/dashboard', async (req, res) => {
    const { title, description, steps } = req.body;
    const newProject = projects.addProject(title, description, steps, req.user.username);
    console.log(newProject);
    res.redirect('/dashboard');
});

module.exports = router;