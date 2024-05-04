const express = require('express');
const router = express.Router();
const { drizzle } = require('drizzle-orm/mysql2');
const { setupConnection } = require('../database/client');
const { users } = require('../database/schema/schema'); 
const {eq, and, sql} = require('drizzle-orm');
const bcrypt = require('bcryptjs')

const initializeDatabase = async () => {
    const connection = await setupConnection();
    return drizzle(connection);
};
router.get('/login', (req, res) => {
    res.render('auth/login');
});
router.post('/login', async (req, res) => {
    try {
        const db = await initializeDatabase();
        const { username, password } = req.body;
        const user = await db.select('username', 'password').from(users)
        .where(sql`${users.username} = ${username}`)
        .execute();
        if (user && user.password && bcrypt.compareSync(password, user.password)) {
            req.session.username = user.username;
            req.session.userId = user.id;
            res.redirect('/posts');
        } else {
            res.redirect('/auth/login');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Error logging in');
    }
});

 router.get('/register', (req, res) => {
    res.render('auth/register');
}
);


router.post('/register', async (req, res) => {
    try {
        const db = await initializeDatabase();
        const { username, password, email } = req.body;
        await db.insert(users).values({ username, password: bcrypt.hashSync(password, 10), email }).execute();
        res.status(200).send('User registered successfully');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

module.exports = router;
