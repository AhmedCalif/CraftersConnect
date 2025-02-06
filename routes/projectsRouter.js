const express = require('express');
const { db } = require('../database/databaseConnection.js')
const { eq, and, like, desc, or, inArray} = require('drizzle-orm');
const schema = require('../database/schema/schemaModel.js');
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
        const [project] = await db.select()
            .from(schema.projects)
            .where(eq(schema.projects.projectId, parseInt(projectId)))
            .leftJoin(schema.users, eq(schema.projects.userId, schema.users.userId))
            .limit(1);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (!req.file?.path) {
            return res.status(400).json({ success: false, message: 'Image not uploaded' });
        }

        const [existingImage] = await db.update(schema.images)
            .set({ link: req.file.path })
            .where(eq(schema.images.projectId, parseInt(projectId)))
            .returning();

        if (!existingImage) {
            await db.insert(schema.images)
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
        const [user] = await db.select()
            .from(schema.users)
            .where(eq(schema.users.username, req.session.username))
            .leftJoin(schema.avatars, eq(schema.users.userId, schema.avatars.userId))
            .limit(1);

        const searchQuery = req.query.search || '';
        const sortOption = req.query.sort || '';

        // Base query with all necessary joins
        let query = db.select({
            projectId: schema.projects.projectId,
            title: schema.projects.title,
            description: schema.projects.description,
            date: schema.projects.date,
            userId: schema.projects.userId,
            imageUrl: schema.images.link,
            creatorUsername: {
                username: schema.users.username
            }
        })
        .from(schema.projects)
        .leftJoin(schema.users, eq(schema.projects.userId, schema.users.userId))
        .leftJoin(schema.images, eq(schema.projects.projectId, schema.images.projectId));

        if (searchQuery) {
            query = query.where(like(schema.projects.title, `%${searchQuery}%`));
        }

        if (sortOption) {
            const [sortBy, sortOrder] = sortOption.split('_');
            query = query.orderBy(sortOrder === 'desc' ? desc(schema.projects[sortBy]) : schema.projects[sortBy]);
        }

        let projectsData = await query;
        const projectIds = projectsData.map(p => p.projectId);

        const collaboratorsData = await db.select({
            projectId: schema.collaborators.projectId,
            username: schema.users.username
        })
        .from(schema.collaborators)
        .where(inArray(schema.collaborators.projectId, projectIds))
        .leftJoin(schema.users, eq(schema.collaborators.userId, schema.users.userId));

        // Format the projects data to match the template expectations
        const formattedProjects = projectsData.map(project => ({
            projectId: project.projectId,
            title: project.title,
            description: project.description,
            date: project.date,
            Image: project.imageUrl ? { link: project.imageUrl } : null,
            Creator: {
                username: project.creatorUsername.username
            },
            Collaborators: collaboratorsData
                .filter(c => c.projectId === project.projectId)
                .map(c => ({ username: c.username }))
        }));

        res.render('projects/search', {
            projects: formattedProjects,
            username: req.session.username,
            avatar: user?.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3',
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
        const [user] = await db.select()
            .from(schema.users)
            .where(eq(schema.users.username, req.session.username))
            .limit(1);

        if (!user) {
            return res.status(400).send("User not found");
        }

        const [newProject] = await db.insert(schema.projects)
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
            await db.insert(schema.images)
                .values({
                    link: req.file.path,
                    projectId: newProject.projectId
                });
        }

        if (steps?.length) {
            await db.insert(schema.steps)
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
        
        // First fetch project with basic joins
        const [projectData] = await db.select({
            projectId: schema.projects.projectId,
            title: schema.projects.title,
            description: schema.projects.description,
            date: schema.projects.date,
            userId: schema.projects.userId,
            creatorUsername: schema.users.username,
            imageUrl: schema.images.link
        })
        .from(schema.projects)
        .where(eq(schema.projects.projectId, parseInt(id)))
        .leftJoin(schema.users, eq(schema.projects.userId, schema.users.userId))
        .leftJoin(schema.images, eq(schema.projects.projectId, schema.images.projectId))
        .limit(1);

        if (!projectData) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Fetch steps
        const projectSteps = await db.select({
            stepId: schema.steps.stepId,
            description: schema.steps.description,
            completed: schema.steps.completed
        })
        .from(schema.steps)
        .where(eq(schema.steps.projectId, parseInt(id)));

        // Fetch collaborators
        const projectCollaborators = await db.select({
            userId: schema.users.userId,
            username: schema.users.username,
            avatarUrl: schema.avatars.imageUrl
        })
        .from(schema.collaborators)
        .where(eq(schema.collaborators.projectId, parseInt(id)))
        .leftJoin(schema.users, eq(schema.collaborators.userId, schema.users.userId))
        .leftJoin(schema.avatars, eq(schema.users.userId, schema.avatars.userId));

        // Fetch mood images
        const projectMoodImages = await db.select({
            link: schema.moodImages.link,
            uploadedBy: schema.moodImages.uploadedBy
        })
        .from(schema.moodImages)
        .where(eq(schema.moodImages.projectId, parseInt(id)));

        // Construct the complete project object
        const project = {
            ...projectData,
            Creator: {
                username: projectData.creatorUsername
            },
            Steps: projectSteps || [],
            MoodImages: projectMoodImages || [],
            Image: projectData.imageUrl ? { link: projectData.imageUrl } : null
        };

        const collaborators = projectCollaborators.map(c => ({
            userId: c.userId,
            username: c.username,
            avatarUrl: c.avatarUrl || 'https://i.pravatar.cc/150?img=3'
        }));

        res.render('projects/show', {
            project,
            loggedInUsername: req.session.username,
            loggedInUserId: req.session.userId,
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
        const [project] = await db.select()
            .from(schema.projects)
            .where(eq(schema.projects.projectId, parseInt(req.params.id)))
            .leftJoin(schema.steps, eq(schema.projects.projectId, schema.steps.projectId))
            .limit(1);

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

        await db.update(schema.projects)
            .set({
                title: DOMPurify.sanitize(title),
                description: DOMPurify.sanitize(description),
                updatedAt: new Date()
            })
            .where(eq(schema.projects.projectId, parseInt(id)));

        // Handle steps updates
        if (steps?.length) {
            for (const step of steps) {
                if (step.id) {
                    await db.update(schema.steps)
                        .set({
                            description: DOMPurify.sanitize(step.description),
                            completed: step.completed === 'true'
                        })
                        .where(eq(schema.steps.stepId, parseInt(step.id)));
                } else {
                    await db.insert(schema.steps)
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
        const [user] = await db.select()
            .from(schema.users)
            .where(eq(schema.users.username, req.session.username))
            .limit(1);

        if (user) {
            await db.insert(schema.collaborators)
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
        const [user] = await db.select()
            .from(schema.users)
            .where(eq(schema.users.username, req.session.username))
            .limit(1);

        if (user) {
            await db.delete(schema.collaborators)
                .where(and(
                    eq(schema.collaborators.projectId, parseInt(projectId)),
                    eq(schema.collaborators.userId, user.userId)
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

        const [invite] = await db.insert(schema.invites)
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

        const [invite] = await db.select()
            .from(schema.invites)
            .where(
                and(
                    eq(schema.invites.token, token),
                    eq(schema.invites.status, 'pending')
                )
            )
            .limit(1);

        if (!invite) {
            return res.status(400).json({ message: 'Invalid or expired invite token' });
        }

        await db.insert(schema.collaborators)
            .values({
                projectId: invite.projectId,
                userId: parseInt(userId)
            });

        await db.update(schema.invites)
            .set({ status: 'accepted' })
            .where(eq(schema.invites.token, token));

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
        const [newImage] = await db.insert(schema.moodImages)
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
        await db.delete(schema.moodImages)
            .where(and(
                eq(schema.moodImages.link, imageLink),
                eq(schema.moodImages.projectId, parseInt(projectId))
            ));

        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;