// cloudinaryController.js
const cloudinaryService = require('../services/cloudinaryService');

// base64 이미지를 Cloudinary에 업로드하는 컨트롤러
exports.uploadImageController = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // base64 데이터를 Cloudinary에 업로드
    const result = await cloudinaryService.uploadImage(image);

    return res.status(200).json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
};
