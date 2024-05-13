const router = require("express").Router();
const {
  User,
  Post,
  Project,
  Avatar,
  Step,
} = require("../database/schema/schemaModel");
const { Sequelize } = require("sequelize");

router.get("/results", async (req, res) => {
  const searchTerm = req.query.query;
  const user = await User.findOne({
    where: { username: req.session.username },
    include: Avatar,
  });

  const avatarUrl = user.Avatar ? user.Avatar.imageUrl : 'https://i.pravatar.cc/150?img=3';

  const projects = await Project.findAll({
    include: {
      title: {
        [Sequelize.Op.like]: `${searchTerm}`,
      },
    },
    include: [{
        model: User,
        include: [Avatar]
    }]
  });


    res.render("projects/list", {
      projects,
      username: req.session.username,
      avatar: avatarUrl
    });
  
});



// const searchProjects = async (searchTerm, page = 1, pageSize = 10) => {
//     const { count, rows } = await Project.findAndCountAll({
//       where: {
//         name: {
//           [Sequelize.Op.like]: `%${searchTerm}%`
//         }
//       },
//       limit: pageSize,
//       offset: (page - 1) * pageSize,
//       order: [
//         ['createdAt', 'DESC']
//       ]
//     });

//     return {
//       data: rows,
//       total: count,
//       currentPage: page,
//       totalPages: Math.ceil(count / pageSize)
//     };
//   };

//   // Example usage
//   const searchTerm = 'example';
//   searchProjects(searchTerm, 1, 10).then(results => {
//     console.log(results);
//   });

module.exports = router;
