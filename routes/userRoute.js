const router = require('express').Router();
const bcrypt = require('bcryptjs');
const {users} = require('../models/userModel');

router.get('/login', (req, res) => {
    res.render("login")
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
        res.redirect('/');  
    } else {
        res.render('register');
    }
});

router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).send("Please fill all fields");
    }
    if (!email.includes('@')) {
        return res.status(400).send("Please enter a valid email address");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword, email });
       res.redirect('/auth/login');
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("An error occurred during registration");
    }
});

router.get('/logout', (req, res) => {
    res.redirect('/auth/login');
});


module.exports = router;
