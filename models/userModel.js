// Fake users
const bcrypt = require('bcryptjs');

const users = [
    {
        username: "ahmedcalif",
        password: bcrypt.hashSync("password", 10),
        email: "ahmedcalif88@gmail.com",
    }, 
    {
        username: "allisondahan",
        password: bcrypt.hashSync("newpassword2", 10),
        email: "allisondahan@gmail.com",
    },
    {
        username: "johndoe",
        password: bcrypt.hashSync("newpassword3", 10),
        email: "john123@gmail.com"
    },  
    {
        username: "janedoe",
        password: bcrypt.hashSync("newpassword4", 10),
        email: "jane123@gmail.com"
    },
    {
        username: "michaelsmith",
        password: bcrypt.hashSync("newpassword5", 10),
        email: "michael456@gmail.com"
    }
];

module.exports = users;