const express = require('express');
const { eq, and, like, desc, or } = require('drizzle-orm');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { db } = require('../database/databaseConnection.js')
const {
    users,
    projects,
    steps,
    images,
    avatars,
    collaborators,
    moodImages,
    invites
} = require('../database/schema/schemaModel.js')
const { ensureAuthenticated } = require('../middleware/middleware');

const router = express.Router();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);



// Configure Cloudinary upload middleware
function uploadMiddleware(folderName) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: (req, file) => {
            const folderPath = `${folderName.trim()}`;
            const fileExtension = path.extname(file.originalname).substring(1);
            const publicId = `${req.session.userId}-${file.fieldname}`;
            
            return {
                folder: folderPath,
                public_id: publicId,
                format: fileExtension,
                overwrite: true,
            };
        },
    });
    return multer({ storage });
}

const upload = uploadMiddleware("/uploads");

// Create new project with cover image
router.post("/create", ensureAuthenticated, upload.single('coverImage'), async (req, res) => {
    try {
        const { title, description, steps: stepsList, date } = req.body;
        
        // Find user
        const user = await db.select()
            .from(users)
            .where(eq(users.username, req.session.username))
            .get();

        if (!user) {
            return res.status(400).send("User not found");
        }

        // Create project
        const [newProject] = await db.insert(projects)
            .values({
                title,
                description,
                userId: user.userId,
                date: new Date(date),
                createdAt: new Date(date),
                updatedAt: new Date(date)
            })
            .returning();

        // Handle cover image
        if (req.file?.path) {
            await db.insert(images)
                .values({
                    link: req.file.path,
                    projectId: newProject.projectId
                });
        }

        // Create steps
        if (stepsList?.length) {
            await db.insert(steps)
                .values(stepsList.map(step => ({
                    description: step,
                    projectId: newProject.projectId,
                    completed: false
                })));
        }

        res.redirect(`/projects/${newProject.projectId}`);
    } catch (err) {
        console.error("Error creating project:", err);
        res.status(500).send("Failed to create project. Please try again.");
    }
});

// Get created projects
router.get("/created", ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.select()
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username))
            .get();

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get created projects with all related data
        const createdProjects = await db.select()
            .from(projects)
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(steps, eq(projects.projectId, steps.projectId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .where(eq(projects.userId, user.users.userId));

        // Process projects to handle joins correctly
        const processedProjects = createdProjects.reduce((acc, row) => {
            const projectId = row.projects.projectId;
            if (!acc[projectId]) {
                acc[projectId] = {
                    ...row.projects,
                    creator: row.users,
                    avatar: row.avatars,
                    steps: [],
                    image: row.images
                };
            }
            if (row.steps) {
                acc[projectId].steps.push(row.steps);
            }
            return acc;
        }, {});

        const avatarUrl = user.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3';

        res.render('userProjects/created', {
            createdProjects: Object.values(processedProjects),
            user: user.users,
            loggedInUsername: req.session.username,
            avatarUrl
        });
    } catch (error) {
        console.error("Error fetching created projects:", error);
        res.status(500).send("Server Error");
    }
});

// Get collaborated projects
router.get("/collaborated", ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.select()
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username))
            .get();

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get projects where user is a collaborator
        const collaboratedProjects = await db.select()
            .from(projects)
            .leftJoin(collaborators, eq(projects.projectId, collaborators.projectId))
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(steps, eq(projects.projectId, steps.projectId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .where(eq(collaborators.userId, user.users.userId));

        // Process projects to handle joins correctly
        const processedProjects = collaboratedProjects.reduce((acc, row) => {
            const projectId = row.projects.projectId;
            if (!acc[projectId]) {
                acc[projectId] = {
                    ...row.projects,
                    creator: row.users,
                    avatar: row.avatars,
                    steps: [],
                    image: row.images
                };
            }
            if (row.steps) {
                acc[projectId].steps.push(row.steps);
            }
            return acc;
        }, {});

        const avatarUrl = user.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3';

        res.render('userProjects/collaborated', {
            collaboratedProjects: Object.values(processedProjects),
            user: user.users,
            avatarUrl,
            loggedInUsername: req.session.username
        });
    } catch (error) {
        console.error("Error fetching collaborated projects:", error);
        res.status(500).send("Server Error");
    }
});

// Get all user's projects (both created and collaborated)
router.get("/all", ensureAuthenticated, async (req, res) => {
    try {
        const user = await db.select()
            .from(users)
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .where(eq(users.username, req.session.username))
            .get();

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get created projects
        const createdProjects = await db.select()
            .from(projects)
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(steps, eq(projects.projectId, steps.projectId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .where(eq(projects.userId, user.users.userId));

        // Get collaborated projects
        const collaboratedProjects = await db.select()
            .from(projects)
            .leftJoin(collaborators, eq(projects.projectId, collaborators.projectId))
            .leftJoin(users, eq(projects.userId, users.userId))
            .leftJoin(avatars, eq(users.userId, avatars.userId))
            .leftJoin(steps, eq(projects.projectId, steps.projectId))
            .leftJoin(images, eq(projects.projectId, images.projectId))
            .where(eq(collaborators.userId, user.users.userId));

        // Process and combine projects
        const processProjects = (projects) => {
            return projects.reduce((acc, row) => {
                const projectId = row.projects.projectId;
                if (!acc[projectId]) {
                    acc[projectId] = {
                        ...row.projects,
                        creator: row.users,
                        avatar: row.avatars,
                        steps: [],
                        image: row.images
                    };
                }
                if (row.steps) {
                    acc[projectId].steps.push(row.steps);
                }
                return acc;
            }, {});
        };

        const processedCreated = processProjects(createdProjects);
        const processedCollaborated = processProjects(collaboratedProjects);

        // Combine and deduplicate projects
        const allProjects = [...Object.values(processedCreated), ...Object.values(processedCollaborated)]
            .filter((project, index, self) => 
                index === self.findIndex((p) => p.projectId === project.projectId)
            );

        const avatarUrl = user.avatars?.imageUrl || 'https://i.pravatar.cc/150?img=3';

        res.render('userProjects/all', {
            allProjects,
            createdProjects: Object.values(processedCreated),
            collaboratedProjects: Object.values(processedCollaborated),
            user: user.users,
            avatarUrl,
            loggedInUsername: req.session.username
        });
    } catch (error) {
        console.error("Error fetching all projects:", error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;