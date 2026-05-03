const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a single image to Cloudinary
 *
 * @param {string} base64Image  - base64 string from frontend (e.g. "data:image/jpeg;base64,...")
 * @param {string} folder       - Cloudinary folder name (e.g. "farmlink/equipment")
 * @param {object} options      - extra Cloudinary options (optional)
 * @returns {object}            - { url, publicId }
 */
const uploadImage = async (base64Image, folder = "farmlink", options = {}) => {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, height: 900, crop: "limit" },  // max size — don't upscale
      { quality: "auto:good" },                      // auto compress
      { fetch_format: "auto" },                      // serve webp/avif to modern browsers
    ],
    ...options,
  });

  return {
    url:      result.secure_url,   // HTTPS CDN URL — this is what we store in MongoDB
    publicId: result.public_id,    // needed if you want to delete the image later
  };
};

/**
 * Upload multiple images to Cloudinary
 *
 * @param {string[]} base64Images - array of base64 strings
 * @param {string}   folder       - Cloudinary folder
 * @returns {object[]}            - array of { url, publicId }
 */
const uploadImages = async (base64Images, folder = "farmlink") => {
  const uploads = base64Images.map((img) => uploadImage(img, folder));
  return Promise.all(uploads);
};

/**
 * Delete an image from Cloudinary by its publicId
 * Call this when a listing is deleted or image is replaced
 *
 * @param {string} publicId - the public_id returned during upload
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, uploadImages, deleteImage };
