const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (base64Image) => {
  return await cloudinary.uploader.upload(base64Image, {
    folder: 'uploads',
    resource_type: 'image',
  });
};
