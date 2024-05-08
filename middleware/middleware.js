const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinaryConfig.js");

function uploadMiddleware(folderName) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      const folderPath = `${folderName.trim()}`; 
      const fileExtension = path.extname(file.originalname).substring(1);
      const publicId = `${file.fieldname}-${Date.now()}`;
      
      return {
        folder: folderPath,
        public_id: publicId,
        format: fileExtension,
      };
    },
  });

  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, 
    },
  });
}



module.exports = {
    attachUser: function(req, res, next) {
        res.locals.username = req.session.username || 'Guest';
        next();
    },
    ensureAuthenticated: function(req, res, next) {
        if (!req.session.username) {
            return res.redirect('/auth/login');
        }
        next();
    },
    errorHandler: function(err, req, res, next) {
        console.error(err);
        if (res.headersSent) {
            return res.end();
        }
        res.status(500).send('Internal Server Error');
    },
     uploadMiddleware
};


