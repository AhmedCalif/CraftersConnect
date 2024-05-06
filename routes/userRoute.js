const router = require('express').Router();
const bcrypt = require('bcryptjs');
const schema = require('../database/schema/schema.js');
const client = require('../database/client.js');
const drizzle = require('drizzle-orm'); 
const {users} = require('../models/userModel.js')

router.get('/login', (req, res) => {
    if (req.session.username) {
        res.redirect('/home/dashboard');  
    } else {
        res.render('auth/login');
    }
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
    }
});

    

router.get('/register', (req, res) => {
    if (req.session.username) {
        res.redirect('/posts');  
    } else {
        res.render('auth/register');
    }
});

router.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const randomAvatar = users[Math.floor(Math.random() * users.length)].avatar; 

    const newUser = {
        username: username,
        password: hashedPassword,
        email: email,
        avatar: randomAvatar  
    };

    users.push(newUser);  
    res.redirect('/posts');  
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {  
        res.redirect('/auth/login');  
    });
});


module.exports = router;


