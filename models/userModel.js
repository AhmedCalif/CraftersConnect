const bcrypt = require('bcryptjs');

// Fake users

const users = [
    {
        id: 1,
        username: "ahmedcalif",
        password: bcrypt.hashSync("password", 10),
        email: "ahmedcalif88@gmail.com",
        avatar: 'https://avatar.iran.liara.run/public/43' 
    }, 
    {
        id: 2,
        username: "allisondahan",
        password: bcrypt.hashSync("newpassword2", 10),
        email: "allisondahan@gmail.com",
        avatar: "https://avatar.iran.liara.run/public/89"
    },
    {
        id: 3,
        username: "johndoe",
        password: bcrypt.hashSync("newpassword3", 10),
        email: "john123@gmail.com",
        avatar: "https://avatar.iran.liara.run/public/6"  
    },  
    {
        id: 4,
        username: "janedoe",
        password: bcrypt.hashSync("newpassword4", 10),
        email: "jane123@gmail.com",
        avatar: "https://avatar.iran.liara.run/public/7"
    },
    {
        id: 5,
        username: "michaelsmith",
        password: bcrypt.hashSync("newpassword5", 10),
        email: "michael456@gmail.com", 
        avatar: "https://avatar.iran.liara.run/public/8"
    }
];

module.exports = {
    users   
};
