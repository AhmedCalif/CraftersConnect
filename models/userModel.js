// Fake users
const bcrypt = require('bcryptjs');

const users = [
    {
        username: "ahmedcalif",
        password: bcrypt.hashSync("password", 10),
        email: "ahmedcalif88@gmail.com",
        avatar: 'https://avatar.iran.liara.run/public/43' 
    }, 
    {
        username: "allisondahan",
        password: bcrypt.hashSync("newpassword2", 10),
        email: "allisondahan@gmail.com",
        avatar: "https://avatar.iran.liara.run/public/89"
    },
    {
        username: "johndoe",
        password: bcrypt.hashSync("newpassword3", 10),
        email: "john123@gmail.com",
        avatar: "https://avatar.iran.liara.run/public/6"  
    },  
    {
        username: "janedoe",
        password: bcrypt.hashSync("newpassword4", 10),
        email: "jane123@gmail.com",
        avatar: "https://avatar.iran.liara.run/public/7"
    },
    {
        username: "michaelsmith",
        password: bcrypt.hashSync("newpassword5", 10),
        email: "michael456@gmail.com", 
        avatar: "https://avatar.iran.liara.run/public/8"
    }
];

module.exports = {
    users   
};
