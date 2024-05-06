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
    email: Sequelize.STRING
});

const Post = sequelize.define('Post', {
    postId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    description: Sequelize.TEXT,
    title: Sequelize.STRING,
    createdAt: Sequelize.DATE
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
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId' });

Project.hasOne(Image, { foreignKey: 'projectId' });
Image.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Collaborator, { foreignKey: 'projectId' });
Collaborator.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Step, { foreignKey: 'projectId' });
Step.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = { User, Post, Project, Image, Collaborator, Step };


sequelize.sync({ force: false }).then(() => {
    console.log("Tables have been created");
}).catch(error => console.error('Unable to create tables', error));
