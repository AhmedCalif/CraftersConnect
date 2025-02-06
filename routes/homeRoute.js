const express = require('express');
const { db } = require('../database/databaseConnection.js')
const { eq, and } = require('drizzle-orm');
const { users, posts, projects, avatars, images, collaborators } = require('../database/schema/schemaModel.js')
const { ensureAuthenticated } = require('../middleware/middleware.js');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }

    try {

        const user = await db.select()
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username))
            .get();

        if (!user) {
            return res.status(404).send("User not found");
        }

       const postsData = await db.select({
            post: posts,
            creator: {
            username: users.username,
            userId: users.userId,
            Avatar: {
            imageUrl: avatars.imageUrl
        }
        }
        })
        .from(posts)
        .leftJoin(users, eq(posts.createdBy, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId))



        const createdProjects = await db.select()
            .from(projects)
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .where(eq(projects.userId, user.users.userId));

        const collaboratedProjects = await db.select()
            .from(projects)
            .leftJoin(collaborators, eq(projects.projectId, collaborators.projectId))
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .where(eq(collaborators.userId, user.users.userId));

        const allProjects = [...createdProjects, ...collaboratedProjects]
            .filter((project, index, self) => 
                index === self.findIndex((p) => p.projects.projectId === project.projects.projectId)
            );

        const formattedPosts = postsData.map(post => ({
    ...post.post,
    creator: {
        username: post.creator.username,
        Avatar: {
            imageUrl: post.creator.Avatar.imageUrl
        }
    }
}));
        const userProjects = await db.select()
            .from(projects)
            .where(eq(projects.userId, user.users.userId));
        
        
        
            const newProjects = await db.select()
            .from(projects)
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .orderBy(projects.createdAt)
            .limit(5);

        const avatarUrl = user.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3';

        res.render('home/dashboard', {
            user: user.users,
            posts: formattedPosts,
            projects: userProjects,
            newProjects,
            avatarUrl,
            allProjects
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Server Error");
    }
});

router.post('/dashboard', async (req, res) => {
    const { title, description, steps } = req.body;
    try {
        const [newProject] = await db.insert(projects)
            .values({
                title,
                description,
                userId: req.session.userId
            })
            .returning();

        if (steps && steps.length) {
            await db.insert(steps)
                .values(steps.map(stepDescription => ({
                    description: stepDescription,
                    projectId: newProject.projectId
                })));
        }

        console.log(newProject);
        res.redirect('/dashboard');
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).send("Failed to create project");
    }
});

module.exports = router;