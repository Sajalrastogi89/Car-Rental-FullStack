// Import required dependencies
const AWS = require('aws-sdk');

// Initialize AWS SQS client with credentials from environment variables
const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * @description Send a message to AWS SQS queue
 * @param {Object} sqs - AWS SQS client instance
 * @param {Object} params - Message parameters including QueueUrl and MessageBody
 * @returns {Promise<Object>} - SQS response data
 */
async function awsSendMessage(sqs, params) {
  try {
    // Use the SQS SDK to send a message with the specified parameters
    const data = await sqs.sendMessage(params).promise();
    // Return the response data
    return data;
  } catch (error) {
    // If an error occurs, log the error message
    console.error('Error:', error);
  }
}

/**
 * @description Send bidding data to AWS SQS queue
 * @param {Object} bidData - Bid information to be queued
 * @returns {Promise<Object>} - SQS response
 */
const sendBidToQueue = async (bidData) => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(bidData),
  };

  const response = await awsSendMessage(sqs, params);

  return response;
};

// Export functions for use in other modules
module.exports = { sendBidToQueue }; 