// database/schema/models.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../databaseConnection.js');

// Define default timestamp fields
const defaultTimestamps = {
  createdAt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: () => Math.floor(Date.now() / 1000)
  },
  updatedAt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: () => Math.floor(Date.now() / 1000)
  }
};

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  ...defaultTimestamps
}, {
  tableName: 'Users',
  timestamps: true
});

const Post = sequelize.define('Post', {
  postId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  description: DataTypes.TEXT,
  title: DataTypes.TEXT,
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
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Project = sequelize.define('Project', {
  projectId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: DataTypes.TEXT,
  description: DataTypes.TEXT,
  date: {
    type: DataTypes.INTEGER,
    defaultValue: () => Math.floor(Date.now() / 1000)
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'userId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Image = sequelize.define('Image', {
  imageId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  link: DataTypes.TEXT,
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: 'projectId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Collaborator = sequelize.define('Collaborator', {
  collaboratorId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Step = sequelize.define('Step', {
  stepId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  description: DataTypes.TEXT,
  completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: 'projectId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Like = sequelize.define('Like', {
  likeId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  likedBy: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  postId: {
    type: DataTypes.INTEGER,
    references: {
      model: Post,
      key: 'postId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Avatar = sequelize.define('Avatar', {
  avatarId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    type: DataTypes.TEXT,
    allowNull: false
  },
  uploadDate: {
    type: DataTypes.INTEGER,
    defaultValue: () => Math.floor(Date.now() / 1000)
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Message = sequelize.define('Message', {
  messageId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Chat = sequelize.define('Chat', {
  chatId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Project,
      key: 'projectId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const MoodImage = sequelize.define('MoodImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  link: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Project,
      key: 'projectId'
    }
  },
  uploadedBy: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const LikeChat = sequelize.define('LikeChat', {
  likeChatId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chat,
      key: 'chatId'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

const Invite = sequelize.define('Invite', {
  inviteId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'pending'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Project,
      key: 'projectId'
    }
  },
  invitedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId'
    }
  },
  ...defaultTimestamps
}, {
  timestamps: true
});

// Define all relationships
User.hasMany(Post, { as: 'Posts', foreignKey: 'createdBy' });
Post.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(Post, { foreignKey: 'postId' });
Post.hasMany(Like, { foreignKey: 'postId' });

User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'Creator' });

User.hasOne(Avatar, { foreignKey: 'userId' });
Avatar.belongsTo(User, { as: 'User', foreignKey: 'userId' });

Project.hasOne(Image, { foreignKey: 'projectId' });
Image.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Step, { foreignKey: 'projectId', as: 'Steps' });
Step.belongsTo(Project, { foreignKey: 'projectId' });

User.belongsToMany(Project, { through: Collaborator, as: 'Collaborations', foreignKey: 'userId' });
Project.belongsToMany(User, { through: Collaborator, as: 'Collaborators', foreignKey: 'projectId' });

User.hasMany(Message, { as: 'SentMessages', foreignKey: 'userId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'receiverId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'userId' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

User.hasMany(Chat, { as: 'UserChats', foreignKey: 'userId' });
Chat.belongsTo(User, { foreignKey: 'userId', as: 'Sender' });

Project.hasMany(Chat, { as: 'ProjectChats', foreignKey: 'projectId' });
Chat.belongsTo(Project, { foreignKey: 'projectId', as: 'Project' });

Project.hasMany(MoodImage, { foreignKey: 'projectId' });
MoodImage.belongsTo(Project, { foreignKey: 'projectId' });

Chat.hasMany(LikeChat, { foreignKey: 'chatId' });
LikeChat.belongsTo(Chat, { foreignKey: 'chatId' });

User.hasMany(LikeChat, { foreignKey: 'userId' });
LikeChat.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User, Post, Project, Image, Collaborator, Step,
  Like, Avatar, Message, Chat, MoodImage, LikeChat, Invite
};