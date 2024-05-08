const sequelize = require('../databaseConnection.js');
const {Sequelize} = require('sequelize');

const User = sequelize.define('User', {
    userId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    email: Sequelize.STRING,
    
});

const Post = sequelize.define('Post', {
    postId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    description: Sequelize.TEXT,
    title: Sequelize.STRING,
    createdAt: Sequelize.DATE,
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'User', 
            key: 'id',      
        }
    },
});


const Project = sequelize.define('Project', {
    projectId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: Sequelize.STRING,
    description: Sequelize.TEXT,
    date: Sequelize.DATE
});

const Image = sequelize.define('Image', {
    imageId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    link: Sequelize.TEXT
});

const Collaborator = sequelize.define('Collaborator', {
    collaboratorId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: Sequelize.STRING
});

const Step = sequelize.define('Step', {
    stepId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    description: Sequelize.TEXT
});

const Like = sequelize.define('like', {
    likeId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    likedBy: Sequelize.STRING
});
const Avatar = sequelize.define('Avatar', {
    avatarId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', 
            key: 'userId'
        }
    },
    imageUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    uploadDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});

User.hasMany(Post, { foreignKey: 'createdBy' });
User.hasMany(Like, { foreignKey: 'userId' });


Post.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Like.belongsTo(Post, { foreignKey: 'postId'});
Post.hasMany(Like, { foreignKey: 'postId' });

User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Avatar, { foreignKey: 'userId' });
Avatar.belongsTo(User, { foreignKey: 'userId' });

Project.hasOne(Image, { foreignKey: 'projectId' });
Image.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Collaborator, { foreignKey: 'projectId' });
Collaborator.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Step, { foreignKey: 'projectId' });
Step.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = { User, Post, Project, Image, Collaborator, Step, Like, Avatar };

sequelize.query("SELECT MAX(userId) AS maxId FROM Users;")
    .then(result => {
        const maxId = result[0][0].maxId;
        const nextId = maxId + 1; 
        return sequelize.query(`ALTER TABLE Users AUTO_INCREMENT = ${nextId};`);
    })
    .then(() => console.log("Auto-increment has been reset to follow the last userId."))
    .catch(error => console.error("Error resetting auto-increment:", error));


sequelize.sync({ force: false }).then(() => {
    console.log("Tables have been created");
}).catch(error => console.error('Unable to create tables', error));
