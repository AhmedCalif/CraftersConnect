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

Post.prototype.isLikedBy = async function(userId) {
  const like = await Like.findOne({ where: { postId: this.postId, userId } });
  return !!like;
}


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
  },
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
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
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
      key: 'postId',
      onDelete: 'CASCADE'  
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
      key: 'userId',
      onDelete: 'CASCADE'  // Cascade delete Avatar when a User is deleted
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
  }
}, {
  timestamps: true
});

const Chat = sequelize.define('Chat', {
  chatId: {
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
  }
}, {
  timestamps: true
});

const MoodImage = sequelize.define('MoodImage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'projectId'
    }
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: true
});


const LikeChat = sequelize.define('LikeChat', {
  likeChatId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  chatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chat,
      key: 'chatId',
      onDelete: 'CASCADE'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId',
      onDelete: 'CASCADE'
    }
  }
}, {
  timestamps: true
});

Chat.hasMany(LikeChat, { foreignKey: 'chatId', onDelete: 'CASCADE' });
LikeChat.belongsTo(Chat, { foreignKey: 'chatId' });

User.hasMany(LikeChat, { foreignKey: 'userId', onDelete: 'CASCADE' });
LikeChat.belongsTo(User, { foreignKey: 'userId' });


User.hasMany(Post, { as: 'Posts', foreignKey: 'createdBy' });
User.hasMany(Like, { foreignKey: 'userId' });

Post.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Like.belongsTo(Post, { foreignKey: 'postId' });
Post.hasMany(Like, { foreignKey: 'postId', onDelete: 'CASCADE' });

User.hasMany(Project, { foreignKey: 'userId' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'Creator' });

User.hasOne(Avatar, { foreignKey: 'userId', onDelete: 'CASCADE' });
Avatar.belongsTo(User, { as: 'User', foreignKey: 'userId' });

Project.hasOne(Image, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Image.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Step, { foreignKey: 'projectId', as: 'Steps', onDelete: 'CASCADE' });
Step.belongsTo(Project, { foreignKey: 'projectId' });

User.belongsToMany(Project, { through: Collaborator, as: 'Collaborations', foreignKey: 'userId' });
Project.belongsToMany(User, { through: Collaborator, as: 'Collaborators', foreignKey: 'projectId' });

User.hasMany(Message, { as: 'SentMessages', foreignKey: 'userId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'receiverId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'userId' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

User.hasMany(Chat, { as: 'UserChats', foreignKey: 'userId' });
Chat.belongsTo(User, { foreignKey: 'userId', as: 'Sender' });

Project.hasMany(Chat, { as: 'ProjectChats', foreignKey: 'projectId', onDelete: 'CASCADE' });
Chat.belongsTo(Project, { foreignKey: 'projectId', as: 'Project' });

Project.hasMany(MoodImage, { foreignKey: 'projectId', onDelete: 'CASCADE' });
MoodImage.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = { User, Post, Project, Image, Collaborator, Step, Like, Avatar, Message, Chat, MoodImage, LikeChat };

// Sync database
sequelize.sync({ force: false }).then(() => {
    console.log("Tables have been created");
}).catch(error => console.error('Unable to create tables', error));
