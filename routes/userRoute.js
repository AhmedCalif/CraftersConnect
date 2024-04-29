const router = require('express').Router();
const bcrypt = require('bcryptjs');
const users = require('../models/userModel');

router.get('/login', (req, res) => {
    res.render("login")
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (user) {
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                res.status(500).send('Error checking password');
            } else if (result) {
                res.render("dashboard", { user });
            } else {
                res.send('Login failed');
            }
        });
    } else {
        res.send('User not found');
    }
});


router.get("/register", (req, res) => {
    res.render("register");
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
       res.render('dashboard', { user: { username, email } });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("An error occurred during registration");
    }
});


module.exports = router;
