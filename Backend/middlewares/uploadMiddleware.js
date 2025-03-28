const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = require("../config/s3Config");

// Create the multer upload instance
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
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Regular uploadSingle middleware
const uploadSingle = upload.single("image");

// Create an optional upload middleware that doesn't error when no file is present
const optionalUploadSingle = (req, res, next) => {
    // Use multer to process the request whether there's a file or not
    console.log("optional");
    upload.single("image")(req, res, function (err) {
        if (err) {
            // Handle any multer errors
            console.log("optional error"); 
            return res.status(400).json({ status: false, error: err.message });
        }
        
        // Continue even if no file was uploaded
        // Since multer will parse the form data, req.body will contain any other form fields
        next();
    });
};

// Modified S3 middleware that continues if no file exists
const uploadToS3 = (req, res, next) => {
    // If no file was uploaded, just continue to the next middleware
    console.log("uploadToS3", req.body);
    if (req.file) {
        req.body.imageUrl = req.file.location;
        req.body.isImage = true;
    }
    next();
};

module.exports = {
    uploadSingle,         // Original middleware that errors if no file
    optionalUploadSingle, // New middleware that continues without file
    uploadToS3
};
