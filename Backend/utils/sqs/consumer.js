// Import required dependencies
const AWS = require('aws-sdk');
const Bid = require('../../models/bidding.model');

// Initialize AWS SQS client with credentials from environment variables
const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * @description Receive messages from AWS SQS queue
 * @param {Object} sqs - AWS SQS client instance
 * @param {Object} params - Parameters including QueueUrl and MaxNumberOfMessages
 * @returns {Promise<Object>} - Retrieved messages data
 */
async function awsReceiveMessage(sqs, params) {
  try {
    // Use the SQS SDK to receive a message with the specified parameters
    const data = await sqs.receiveMessage(params).promise();
    // Return the response data
    return data;
  } catch (error) {
    // If an error occurs, log the error message
    console.error('Error:', error);
  }
}

/**
 * @description Process message content and delete it from the queue
 * @param {Object} message - Message object retrieved from SQS
 */
async function processAndDeleteMessage(message) {
  try {
    // Process the message (parse the bid data and save to DB)
    const bidData = JSON.parse(message.Body);

    const deleteParams = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle
    };
    
    await sqs.deleteMessage(deleteParams).promise();
    console.log('Message deleted successfully');
    
  } catch (error) {
    console.error('Error processing/deleting message:', error);
  }
}

/**
 * @description Retrieve bid information from SQS queue, save to database, and remove from queue
 * @returns {Promise<Array|Object>} - Empty array if no messages or SQS response
 */
const getBidFromQueue = async () => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
  };

  const response = await awsReceiveMessage(sqs, params);
  if (!response.Messages || response.Messages.length === 0) {
    return [];
  }

  // Parse the message body and create a new Bid document
  let biddingObject = JSON.parse(response.Messages[0].Body);
  let bidding = new Bid(biddingObject);
  await bidding.save(); 

  // Delete the processed message from the queue
  await processAndDeleteMessage(response.Messages[0]);
  console.log("deleted");
  return response;
};

// Export functions for use in other modules
module.exports = { getBidFromQueue }; 