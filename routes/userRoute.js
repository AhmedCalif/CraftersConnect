const express = require('express');
const { User } = require('../database/schema/schemaModel');
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
        const user = await User.findOne({ where: { username } });
        if (!user) {
            console.log('No user found with that username');
            return res.status(404).json({ message: 'No user found with that username!' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
            console.log('Password does not match');
            return res.status(401).json({ message: 'Password does not match!' });
        }
        req.session.username = user.username;
        req.session.userId = user.userId;
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

router.get('/register', (req, res) => {
    res.render('auth/register');
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, email, id } = req.body;
        if (username.length < 6 || password.length < 6 || email.length < 6) {
            return res.status(400).json({ message: 'Username, password and email must be at least 6 characters long!' });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await User.create({
            username, 
            password: hashedPassword, 
            email,
            userId: id
        });
        if (!newUser) {
            console.log('Error creating user');
            return res.status(500).json({ message: 'Error creating user' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

router.get('/logout', (req, res) => {  
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;
