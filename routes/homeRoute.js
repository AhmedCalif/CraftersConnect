const express = require('express');
const { db } = require('../database/databaseConnection.js');
const { eq } = require('drizzle-orm');
const { users, posts, projects, avatars, images, collaborators } = require('../database/schema/schemaModel.js');
const { ensureAuthenticated } = require('../middleware/middleware.js');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/auth/login');
    }

    try {
        const userData = await db.select({
            userId: users.userId,
            username: users.username,
            email: users.email,
            avatarUrl: avatars.imageUrl
        })
        .from(users)
        .leftJoin(avatars, eq(users.userId, avatars.userId))
        .where(eq(users.username, req.session.username));

        const user = userData[0];

        if (!user) {
            return res.status(404).send("User not found");
        }

        const postsData = await db.select({
            postId: posts.postId,
            title: posts.title,
            description: posts.description,
            currentLikes: posts.currentLikes,
            createdAt: posts.createdAt,
            creatorUsername: users.username,
            creatorAvatar: avatars.imageUrl
        })
        .from(posts)
        .leftJoin(users, eq(posts.createdBy, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId));

        // Get projects created by the user
        const createdProjects = await db.select({
            projectId: projects.projectId,
            title: projects.title,
            description: projects.description,
            date: projects.date,
            createdAt: projects.createdAt,
            creatorUsername: users.username,
            creatorAvatar: avatars.imageUrl,
            imageLink: images.link
        })
        .from(projects)
        .leftJoin(users, eq(projects.userId, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId))
        .leftJoin(images, eq(projects.projectId, images.projectId))
        .where(eq(projects.userId, user.userId));

        // Get projects where user is a collaborator
        const collaboratedProjects = await db.select({
            projectId: projects.projectId,
            title: projects.title,
            description: projects.description,
            date: projects.date,
            createdAt: projects.createdAt,
            creatorUsername: users.username,
            creatorAvatar: avatars.imageUrl,
            imageLink: images.link
        })
        .from(projects)
        .leftJoin(collaborators, eq(projects.projectId, collaborators.projectId))
        .leftJoin(users, eq(projects.userId, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId))
        .leftJoin(images, eq(projects.projectId, images.projectId))
        .where(eq(collaborators.userId, user.userId));

        // Combine and format all projects
        const allProjects = [...createdProjects, ...collaboratedProjects]
            .filter((project, index, self) => 
                index === self.findIndex((p) => p.projectId === project.projectId)
            )
            .map(project => ({
                projectId: project.projectId,
                title: project.title,
                description: project.description,
                date: project.date,
                createdAt: project.createdAt,
                creator: {
                    username: project.creatorUsername
                },
                Image: {
                    link: project.imageLink || 'https://i.pravatar.cc/150?img=3'
                }
            }));

        // Format posts
        const formattedPosts = postsData.map(post => ({
            postId: post.postId,
            title: post.title,
            description: post.description,
            currentLikes: post.currentLikes,
            createdAt: post.createdAt,
            creator: {
                username: post.creatorUsername,
                Avatar: {
                    imageUrl: post.creatorAvatar || 'https://i.pravatar.cc/150?img=3'
                }
            }
        }));

        const newProjectsData = await db.select({
            projectId: projects.projectId,
            title: projects.title,
            description: projects.description,
            date: projects.date,
            createdAt: projects.createdAt,
            creatorUsername: users.username,
            creatorAvatar: avatars.imageUrl,
            imageLink: images.link
        })
        .from(projects)
        .leftJoin(users, eq(projects.userId, users.userId))
        .leftJoin(avatars, eq(users.userId, avatars.userId))
        .leftJoin(images, eq(projects.projectId, images.projectId))
        .orderBy(projects.createdAt)
        .limit(5);

        const newProjects = newProjectsData.map(project => ({
            projectId: project.projectId,
            title: project.title,
            description: project.description,
            date: project.date,
            createdAt: project.createdAt,
            creator: {
                username: project.creatorUsername
            },
            Image: {
                link: project.imageLink || 'https://i.pravatar.cc/150?img=3'
            }
        }));

        res.render('home/dashboard', {
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email
            },
            posts: formattedPosts,
            projects: allProjects,
            newProjects,
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

        res.redirect('/dashboard');
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).send("Failed to create project");
    }
});

module.exports = router;