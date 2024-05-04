const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../database/schema/schema.js');
const drizzle = require('drizzle-orm');




router.get('/login', (req, res) => {
    res.render("auth/login")
});

router.post('/login', async (req, res) => {
    try {
        const users = await db.users.find({ username: req.body.username });
        if (users.length > 0) {
            const user = users[0];
            if (bcrypt.compareSync(req.body.password, user.password)) {
                req.session.username = user.username;
                req.session.userId = user.id;
                return res.redirect('/posts');
            }
        }
        return res.redirect('/auth/login');
    } catch (error) {
        console.log(error);
        return res.redirect('/auth/login');
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


