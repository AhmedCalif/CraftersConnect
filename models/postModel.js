const userModel = require('./userModel');

const posts = [
    {
        createdBy: userModel.users[0].username,
        date: "Jan 01 24",
        title: "Outdoor Projects",
        description: "DIY projects for outdoor spaces, such as building a fire pit, creating a patio garden, etc."
    },
    {
        createdBy: userModel.users[1].username,
        date: "Jan 01 24",
        title: "Home Improvement",
        description: "DIY projects aimed at improving the functionality or efficiency of your home."
    },
    // Add more posts as necessary
];


module.exports = posts;




