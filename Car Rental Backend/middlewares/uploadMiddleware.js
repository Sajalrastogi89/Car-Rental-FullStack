const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3Config");

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        key: (req, file, cb) => {
            const fileName = `${Date.now()}_${file.originalname}`;
            cb(null, fileName);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadToS3 = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    req.body.imageUrl = req.file.location;
    next();
};

module.exports = {
    uploadSingle: upload.single("image"),
    uploadToS3
};
