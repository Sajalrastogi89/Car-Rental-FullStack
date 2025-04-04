/**
 * @description File upload middleware configuration module for handling image uploads
 * @module middlewares/uploadMiddleware
 */

// Import required dependencies
const multer = require("multer");
const multerS3 = require("multer-s3");

// Import AWS S3 configuration
const s3 = require("../config/s3Config");

/**
 * @description Multer upload configuration with S3 storage
 * @type {Object}
 * @property {Object} storage - S3 storage configuration
 * @property {Object} limits - File size limits
 */
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname }); 
        },
        contentDisposition: 'inline',
        key: (req, file, cb) => {
            const fileName = `${Date.now()}_${file.originalname}`;
            cb(null, fileName);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

/**
 * @description Standard file upload middleware that requires a file
 * @type {Function}
 */
const uploadSingle = upload.single("image");

/**
 * @description Optional file upload middleware that doesn't error when no file is present
 * @function optionalUploadSingle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const optionalUploadSingle = (req, res, next) => {
    upload.single("image")(req, res, function (err) {
        if (err) {
            return res.status(400).json({ status: false, error: err.message });
        }
        
        next();
    });
};

/**
 * @description Middleware to process uploaded file and add file location to request body
 * @function uploadToS3
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const uploadToS3 = (req, res, next) => {
    if (req.file) {
        req.body.imageUrl = req.file.location;
        req.body.isImage = true;
    }
    next();
};

/**
 * @description Export middleware functions for use in route handlers
 */
module.exports = {
    uploadSingle,         // Original middleware that errors if no file
    optionalUploadSingle, // New middleware that continues without file
    uploadToS3            // Adds file location to request body
};
