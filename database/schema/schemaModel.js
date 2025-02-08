const { sqliteTable, text, integer, primaryKey }= require('drizzle-orm/sqlite-core');

 const users = sqliteTable('users', {
  userId: integer('user_id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const posts = sqliteTable('posts', {
  postId: integer('post_id').primaryKey({ autoIncrement: true }),
  description: text('description'),
  title: text('title'),
  currentLikes: integer('current_likes').default(0),
  createdBy: integer('created_by').notNull().references(() => users.userId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const projects = sqliteTable('projects', {
  projectId: integer('project_id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  description: text('description'),
  date: integer('date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  userId: integer('user_id').references(() => users.userId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const images = sqliteTable('images', {
  imageId: integer('image_id').primaryKey({ autoIncrement: true }),
  link: text('link'),
  projectId: integer('project_id').references(() => projects.projectId, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const collaborators = sqliteTable('collaborators', {
  collaboratorId: integer('collaborator_id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').references(() => projects.projectId),
  userId: integer('user_id').references(() => users.userId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const steps = sqliteTable('steps', {
  stepId: integer('step_id').primaryKey({ autoIncrement: true }),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  projectId: integer('project_id').references(() => projects.projectId, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const likes = sqliteTable('likes', {
  likeId: integer('like_id').primaryKey({ autoIncrement: true }),
  likedBy: integer('liked_by').references(() => users.userId).notNull(),
  postId: integer('post_id').references(() => posts.postId, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const avatars = sqliteTable('avatars', {
  avatarId: integer('avatar_id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  uploadDate: integer('upload_date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const messages = sqliteTable('messages', {
  messageId: integer('message_id').primaryKey({ autoIncrement: true }),
  message: text('message').notNull(),
  userId: integer('user_id').notNull().references(() => users.userId),
  receiverId: integer('receiver_id').notNull().references(() => users.userId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const chats = sqliteTable('chats', {
  chatId: integer('chat_id').primaryKey({ autoIncrement: true }),
  message: text('message').notNull(),
  userId: integer('user_id').notNull().references(() => users.userId),
  projectId: integer('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const moodImages = sqliteTable('mood_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  link: text('link').notNull(),
  projectId: integer('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const likeChats = sqliteTable('like_chats', {
  likeChatId: integer('like_chat_id').primaryKey({ autoIncrement: true }),
  chatId: integer('chat_id').notNull().references(() => chats.chatId, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

 const invites = sqliteTable('invites', {
  inviteId: integer('invite_id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  status: text('status').default('pending'),
  projectId: integer('project_id').notNull().references(() => projects.projectId),
  invitedBy: integer('invited_by').notNull().references(() => users.userId),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

module.exports = {
  users,
  posts,
  projects,
  images,
  invites,
  likeChats,
  likes,
  moodImages,
  messages,
  avatars,
  steps,
  collaborators,
  chats
};