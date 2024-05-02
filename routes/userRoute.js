const router = require('express').Router();
const bcrypt = require('bcryptjs');
const {users} = require('../models/userModel');

router.get('/login', (req, res) => {
    res.render("auth/login")
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
                res.redirect('/posts');
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


