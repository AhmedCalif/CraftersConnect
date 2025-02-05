// migrationHelper.js
const { sequelize } = require('./databaseConnection');

async function migrateTables() {
  const client = sequelize.tursoClient;

  try {
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        userId INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);
;

    // Posts table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Posts (
        postId INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        title TEXT,
        currentLikes INTEGER DEFAULT 0,
        createdBy INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (createdBy) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    // Projects table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Projects (
        projectId INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        date INTEGER DEFAULT (unixepoch('now')),
        userId INTEGER,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    // Images table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Images (
        imageId INTEGER PRIMARY KEY AUTOINCREMENT,
        link TEXT,
        projectId INTEGER,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (projectId) REFERENCES Projects(projectId) ON DELETE CASCADE
      )
    `);

    // Collaborators table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Collaborators (
        collaboratorId INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER,
        userId INTEGER,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (projectId) REFERENCES Projects(projectId) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    // Steps table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Steps (
        stepId INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        completed INTEGER DEFAULT 0,
        projectId INTEGER,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (projectId) REFERENCES Projects(projectId) ON DELETE CASCADE
      )
    `);

    // Likes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Likes (
        likeId INTEGER PRIMARY KEY AUTOINCREMENT,
        likedBy TEXT NOT NULL,
        postId INTEGER,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (postId) REFERENCES Posts(postId) ON DELETE CASCADE
      )
    `);

    // Avatars table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Avatars (
        avatarId INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        imageUrl TEXT NOT NULL,
        uploadDate INTEGER DEFAULT (unixepoch('now')),
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    // Messages table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Messages (
        messageId INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        userId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    // Chats table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Chats (
        chatId INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        userId INTEGER NOT NULL,
        projectId INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
        FOREIGN KEY (projectId) REFERENCES Projects(projectId) ON DELETE CASCADE
      )
    `);

    // MoodImages table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS MoodImages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link TEXT NOT NULL,
        projectId INTEGER NOT NULL,
        uploadedBy TEXT NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (projectId) REFERENCES Projects(projectId) ON DELETE CASCADE
      )
    `);

    // LikeChats table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS LikeChats (
        likeChatId INTEGER PRIMARY KEY AUTOINCREMENT,
        chatId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (chatId) REFERENCES Chats(chatId) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    // Invites table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Invites (
        inviteId INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        projectId INTEGER NOT NULL,
        invitedBy INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (unixepoch('now')),
        updatedAt INTEGER DEFAULT (unixepoch('now')),
        FOREIGN KEY (projectId) REFERENCES Projects(projectId) ON DELETE CASCADE,
        FOREIGN KEY (invitedBy) REFERENCES Users(userId) ON DELETE CASCADE
      )
    `);

    console.log('All tables created successfully');
    return true;
  } catch (error) {
    console.error('Error in migration:', error);
    throw error;
  }
}

module.exports = { migrateTables, sequelize };