const express = require('express');
const { db } = require('../database/databaseConnection.js')
const { eq, and, like, desc, or } = require('drizzle-orm');
const { 
    users, projects, steps, images, avatars, 
    collaborators, moodImages, invites 
} = require('../database/schema/schemaModel.js')
const { ensureAuthenticated } = require('../middleware/middleware.js');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinaryConfig.js');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const router = express.Router();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


// Cloudinary storage setup
const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: 'uploads',
        public_id: `${req.session.userId}-${file.fieldname}-${Date.now()}`,
        format: path.extname(file.originalname).substring(1),
        overwrite: true,
    }),
});

const upload = multer({ storage });

// Cover Image Upload Routes
router.post('/upload-coverImage', upload.single('coverImage'), async (req, res) => {
    try {
        if (!req.file?.path) {
            return res.status(400).json({ success: false, message: 'Image not uploaded' });
        }
        return res.status(200).json({ success: true, imageUrl: req.file.path });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/:projectId/upload-coverImage', ensureAuthenticated, upload.single('coverImage'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await db.query.projects.findFirst({
            where: eq(projects.projectId, parseInt(projectId)),
            with: {
                creator: true
            }
        });

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (!req.file?.path) {
            return res.status(400).json({ success: false, message: 'Image not uploaded' });
        }

        const [existingImage] = await db.update(images)
            .set({ link: req.file.path })
            .where(eq(images.projectId, parseInt(projectId)))
            .returning();

        if (!existingImage) {
            await db.insert(images)
                .values({ link: req.file.path, projectId: parseInt(projectId) });
        }

        res.status(200).json({ success: true, imageUrl: req.file.path });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Project CRUD Routes
router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.username, req.session.username),
            with: {
                avatar: true
            }
        });

        const searchQuery = req.query.search || '';
        const sortOption = req.query.sort || '';

        let query = db.select()
            .from(projects)
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(images, eq(projects.projectId, images.projectId));

        if (searchQuery) {
            query = query.where(like(projects.title, `%${searchQuery}%`));
        }

        if (sortOption) {
            const [sortBy, sortOrder] = sortOption.split('_');
            query = query.orderBy(sortOrder === 'desc' ? desc(projects[sortBy]) : projects[sortBy]);
        }

        const projectsData = await query;

        res.render('projects/search', {
            projects: projectsData,
            username: req.session.username,
            avatar: user?.avatar?.imageUrl || 'https://i.pravatar.cc/150?img=3',
            searchQuery,
            sortOption
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error while fetching projects list.");
    }
});

router.get("/create", ensureAuthenticated, (req, res) => {
    res.render("projects/create", { username: req.session.username });
});

router.post("/create", ensureAuthenticated, upload.single('coverImage'), async (req, res) => {
    try {
        const { title, description, steps, date } = req.body;
        const user = await db.query.users.findFirst({
            where: eq(users.username, req.session.username)
        });

        if (!user) {
            return res.status(400).send("User not found");
        }

        const [newProject] = await db.insert(projects)
            .values({
                title: DOMPurify.sanitize(title),
                description: DOMPurify.sanitize(description),
                userId: user.userId,
                date: new Date(date),
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        if (req.file?.path) {
            await db.insert(images)
                .values({
                    link: req.file.path,
                    projectId: newProject.projectId
                });
        }

        if (steps?.length) {
            await db.insert(steps)
                .values(steps.map(step => ({
                    description: DOMPurify.sanitize(step),
                    projectId: newProject.projectId,
                    completed: false
                })));
        }

        res.redirect(`/projects/${newProject.projectId}`);
    } catch (err) {
        console.error("Error creating project:", err);
        res.status(500).send("Failed to create project");
    }
});

router.get("/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const project = await db.query.projects.findFirst({
            where: eq(projects.projectId, parseInt(id)),
            with: {
                steps: true,
                image: true,
                moodImages: true,
                creator: {
                    with: {
                        avatar: true
                    }
                },
                collaborators: {
                    with: {
                        user: {
                            with: {
                                avatar: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const collaborators = project.collaborators.map(collab => ({
            userId: collab.user.userId,
            username: collab.user.username,
            avatarUrl: collab.user.avatar?.imageUrl || 'https://i.pravatar.cc/150?img=3'
        }));

        res.render('projects/show', {
            project,
            loggedInUsername: req.session.username,
            loggedInUserId: req.session.userId,
            avatar: project.creator.avatar?.imageUrl || 'https://i.pravatar.cc/150?img=3',
            collaborators
        });
    } catch (err) {
        console.error("Error fetching project:", err);
        res.status(500).send("Server Error");
    }
});

// Project Update Routes
router.get('/:id/update', ensureAuthenticated, async (req, res) => {
    try {
        const project = await db.query.projects.findFirst({
            where: eq(projects.projectId, parseInt(req.params.id)),
            with: { steps: true }
        });

        if (!project) {
            return res.status(404).send("Project not found");
        }

        res.render('projects/update', { project, username: req.session.username });
    } catch (err) {
        console.error("Error fetching project:", err);
        res.status(500).send("Server Error");
    }
});

router.post('/:id/update', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, steps } = req.body;

        await db.update(projects)
            .set({
                title: DOMPurify.sanitize(title),
                description: DOMPurify.sanitize(description),
                updatedAt: new Date()
            })
            .where(eq(projects.projectId, parseInt(id)));

        // Handle steps updates
        if (steps?.length) {
            for (const step of steps) {
                if (step.id) {
                    await db.update(steps)
                        .set({
                            description: DOMPurify.sanitize(step.description),
                            completed: step.completed === 'true'
                        })
                        .where(eq(steps.stepId, parseInt(step.id)));
                } else {
                    await db.insert(steps)
                        .values({
                            description: DOMPurify.sanitize(step.description),
                            completed: step.completed === 'true',
                            projectId: parseInt(id)
                        });
                }
            }
        }

        res.redirect(`/projects/${id}`);
    } catch (err) {
        console.error("Error updating project:", err);
        res.status(500).send("Failed to update project");
    }
});

// Collaborator Management Routes
router.post('/:projectId/join', ensureAuthenticated, async (req, res) => {
    try {
        const { projectId } = req.params;
        const user = await db.query.users.findFirst({
            where: eq(users.username, req.session.username)
        });

        if (user) {
            await db.insert(collaborators)
                .values({
                    projectId: parseInt(projectId),
                    userId: user.userId
                });
        }

        res.redirect(`/projects/${projectId}`);
    } catch (err) {
        console.error('Error joining project:', err);
        res.status(500).send('Failed to join project');
    }
});

router.post('/:projectId/leave', ensureAuthenticated, async (req, res) => {
    try {
        const { projectId } = req.params;
        const user = await db.query.users.findFirst({
            where: eq(users.username, req.session.username)
        });

        if (user) {
            await db.delete(collaborators)
                .where(and(
                    eq(collaborators.projectId, parseInt(projectId)),
                    eq(collaborators.userId, user.userId)
                ));
        }

        res.status(200).json({ message: 'Left project successfully' });
    } catch (err) {
        console.error('Error leaving project:', err);
        res.status(500).send('Failed to leave project');
    }
});

// Invite System Routes
router.post('/invite', async (req, res) => {
    try {
        const { email, invitedBy, projectId } = req.body;
        const token = crypto.randomBytes(20).toString('hex');

        const [invite] = await db.insert(invites)
            .values({
                email,
                token,
                projectId: parseInt(projectId),
                invitedBy: parseInt(invitedBy),
                status: 'pending'
            })
            .returning();

        res.json({ message: 'Invite created successfully', token });
    } catch (error) {
        console.error('Error creating invite:', error);
        res.status(500).json({ message: 'Failed to create invite' });
    }
});

router.post('/invite/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { userId } = req.body;

        const invite = await db.query.invites.findFirst({
            where: and(
                eq(invites.token, token),
                eq(invites.status, 'pending')
            )
        });

        if (!invite) {
            return res.status(400).json({ message: 'Invalid or expired invite token' });
        }

        await db.insert(collaborators)
            .values({
                projectId: invite.projectId,
                userId: parseInt(userId)
            });

        await db.update(invites)
            .set({ status: 'accepted' })
            .where(eq(invites.token, token));

        res.json({ message: 'Project invite accepted', projectId: invite.projectId });
    } catch (error) {
        console.error('Error accepting invite:', error);
        res.status(500).json({ message: 'Failed to accept invite' });
    }
});

// Mood Board Routes
router.post('/image-link', ensureAuthenticated, async (req, res) => {
    try {
        const { imageLink, projectId } = req.body;
        const [newImage] = await db.insert(moodImages)
            .values({
                link: DOMPurify.sanitize(imageLink),
                projectId: parseInt(projectId),
                uploadedBy: req.session.username
            })
            .returning();

        res.status(201).json(newImage);
    } catch (error) {
        console.error("Error creating image:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.delete('/image-link', async (req, res) => {
    try {
        const { imageLink, projectId } = req.body;
        await db.delete(moodImages)
            .where(and(
                eq(moodImages.link, imageLink),
                eq(moodImages.projectId, parseInt(projectId))
            ));

        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
module.exports = router;