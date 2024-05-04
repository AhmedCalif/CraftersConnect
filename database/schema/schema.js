const { int, mysqlTable, text, timestamp, varchar} =  require('drizzle-orm/mysql-core');

 const users = mysqlTable("users", {
    id: int('id').primaryKey({ autoIncrement: true }),
    username: varchar('username', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
});

 const posts = mysqlTable('posts',{
    id: int('id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull(),
    title: text('title').notNull(),
    userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
   timestamp: timestamp('timestamp').notNull().defaultNow()
});

 const images = mysqlTable('image', {
    id: int('id').primaryKey({ autoIncrement: true }),
    link: text('link').notNull(),
});

 const projects = mysqlTable('projects', {
    id: int('id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull(),
    title: text('title').notNull(),
    imageId: int('imageId').notNull().references(() => images.id, { onDelete: 'cascade' })
});

 const collaborator = mysqlTable('collaborator', {
    id: int('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    projectId: int('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' })
});

 const steps = mysqlTable('steps', {
    id: int('id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull(),
    projectId: int('projectId').notNull().references(() => projects.id, { onDelete: 'cascade' })
});

module.exports = {
    users, 
    projects, 
    posts, 
    steps, 
    collaborator, 
    images
}
