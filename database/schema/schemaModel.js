
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../databaseConnection.js');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
}, {
  timestamps: true
});

const Post = sequelize.define('Post', {
  postId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  description: DataTypes.TEXT,
  title: DataTypes.STRING,
  currentLikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  }
}, {
  timestamps: true
});


const Project = sequelize.define('Project', {
  projectId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'userId'
    }
  }
}, {
  timestamps: true
});

const Image = sequelize.define('Image', {
  imageId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  link: DataTypes.TEXT,
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: 'projectId'
    }
  }
}, {
  timestamps: true
});

const Collaborator = sequelize.define('Collaborator', {
  collaboratorId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: 'projectId'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'userId'
    }
  }
}, {
  timestamps: true
});

const Step = sequelize.define('Step', {
  stepId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  description: DataTypes.TEXT,
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: 'projectId'
    }
  }
}, {
  timestamps: true
});

const Like = sequelize.define('Like', {
  likeId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  likedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postId: {
    type: DataTypes.INTEGER,
    references: {
      model: Post,
      key: 'postId'
    }
  }
}, {
  timestamps: true
});

const Avatar = sequelize.define('Avatar', {
  avatarId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

const Message = sequelize.define('Message', {
  messageId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
  },
  message: {
      type: DataTypes.STRING,
      allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: 'User', 
        key: 'userId'
    }
},

}, {
  timestamps: true
});


// Associations
User.hasMany(Post, { as: 'Posts', foreignKey: 'createdBy' });
User.hasMany(Like, { foreignKey: 'userId' });

Post.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Like.belongsTo(Post, { foreignKey: 'postId' });
Post.hasMany(Like, { foreignKey: 'postId', onDelete: 'CASCADE' });

User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Avatar, { foreignKey: 'userId' });
Avatar.belongsTo(User, { as: 'User', foreignKey: 'userId' });

Project.hasOne(Image, { foreignKey: 'projectId' });
Image.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Step, { foreignKey: 'projectId', as: 'Steps' });
Step.belongsTo(Project, { foreignKey: 'projectId' });

User.belongsToMany(Project, { through: Collaborator, as: 'Collaborations', foreignKey: 'userId' });
Project.belongsToMany(User, { through: Collaborator, as: 'Collaborators', foreignKey: 'projectId' });

User.hasMany(Message, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });


module.exports = { User, Post, Project, Image, Collaborator, Step, Like, Avatar, Message };

// Sync database
sequelize.sync({ force: false }).then(() => {
    console.log("Tables have been created");
}).catch(error => console.error('Unable to create tables', error));
