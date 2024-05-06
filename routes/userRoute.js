const express = require('express');
const {User} = require('../database/schema/schemaModel');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/login', (req, res) => {
    if (req.session.username) {
        res.redirect('/home/dashboard');  
    } else {
        res.render('auth/login');
    }
    res.render('auth/login');
});
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (user) {
        console.log(`Attempting to match passwords: input=${password}, stored=${user.password}`);
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error during password comparison:", err);
                return res.status(500).send('Server error');
            }
            if (isMatch) {
                req.session.username = username;
                res.redirect('/home/dashboard');
            } else {
                res.status(401).send('Authentication failed');
            }
        });
    } else {
        res.status(401).send('User not found');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.username = user.username;
            req.session.userId = user.userId; 
            res.redirect('/home/dashboard');
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
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, email, id } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await User.create({
            username, 
            password: hashedPassword, 
            email,
            userId: id
        });
        await newUser.save();
        res.status(200).send('User registered successfully');
        res.redirect('/home/dashboard');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

module.exports = router;
