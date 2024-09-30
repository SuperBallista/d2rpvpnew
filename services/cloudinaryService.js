const cloudinary = require('cloudinary').v2;

exports.uploadImage = (imagePath) => {
  return cloudinary.uploader.upload(imagePath);
};
