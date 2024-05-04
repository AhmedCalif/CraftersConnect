const router = require('express').Router();
const bcrypt = require('bcryptjs');
const schema = require('../database/schema/schema.js');
const {drizzle} = require('drizzle-orm'); 
const {users, projects, posts, images, collaborator} = require('../database/schema/schema.js');
const {setupConnection}= require('../database/client.js');
const dbClient = drizzle(setupConnection, schema);

router.get('/login', (req, res) => {
    if (req.session.username) {
        res.redirect('/posts');  
    } else {
        res.render('auth/login');
    }
});
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = dbClient.select({user: users.username}).from(users).where(eq(username, users.username))
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.username = user.username;
        req.session.userId = user.id;
        res.redirect('/posts');
    } else {
        res.redirect('/auth/login');
    }
});

    

router.get('/register', (req, res) => {
    if (req.session.username) {
        res.redirect('/posts');  
    } else {
        res.render('auth/register');
    }
});

router.post('/register', async  (req, res) => {
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


