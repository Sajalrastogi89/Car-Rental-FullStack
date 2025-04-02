/**
 * @description AWS S3 client configuration for file storage operations
 * @module config/s3Config
 */

// Import required dependencies
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

/**
 * S3 client instance configured with AWS credentials from environment variables
 * @type {S3Client}
 * @description Initialized S3 client for interacting with AWS S3 bucket
 * @property {string} region - AWS region where the S3 bucket is located
 * @property {Object} credentials - AWS authentication credentials
 * @property {string} credentials.accessKeyId - AWS access key ID
 * @property {string} credentials.secretAccessKey - AWS secret access key
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Export the configured S3 client
module.exports = s3;
