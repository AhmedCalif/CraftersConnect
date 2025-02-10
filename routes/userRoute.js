// userRoute.js
const express = require('express');
const { db } = require('../database/databaseConnection.js');
const { users } = require('../database/schema/schemaModel.js');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/login', (req, res) => {
    if (req.session.username) {
        res.redirect('/home/dashboard');
    } else {
        res.render('auth/login');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user by username
        const user = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .get();

        if (!user) {
            console.log('No user found with that username');
            return res.status(404).json({ 
                message: 'No user found with that username!' 
            });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            console.log('Password does not match');
            return res.status(401).json({ 
                message: 'Password does not match!' 
            });
        }

        req.session.username = user.username;
        req.session.userId = user.userId;
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (username.length < 6 || password.length < 6 || email.length < 6) {
            return res.status(400).json({ 
                message: 'Username, password and email must be at least 6 characters long!' 
            });
        }

        // Check for existing user
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .get();

        if (existingUser) {
            return res.status(400).json({
                message: 'Username already exists!'
            });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        
        // Create new user
        const [newUser] = await db.insert(users)
            .values({
                username,
                password: hashedPassword,
                email
            })
            .returning({ userId: users.userId });

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: newUser.userId
        });
    } catch (error) {
        console.error('Error registering user:', error);
        
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ 
                message: 'Username or email already exists' 
            });
        }
        
        res.status(500).json({ message: 'Error registering user' });
    }
});

router.get('/register', (req, res) => {
    res.render('auth/register');
});

router.get('/logout', (req, res) => {  
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;