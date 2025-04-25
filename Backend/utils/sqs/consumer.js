// Import required dependencies
const AWS = require('aws-sdk');
const Bid = require('../../models/bidding.model');
const { sendBidAddedEmail } = require('../mail');

// Initialize AWS SQS client with credentials from environment variables
const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});


async function awsReceiveMessage(sqs, params) {
  try {

    const data = await sqs.receiveMessage(params).promise();
   
    return data;
  } catch (error) {
  
    console.error('Error:', error);
  }
}

/**
 * @description Process message content and delete it from the queue
 * @param {Object} message - Message object retrieved from SQS
 */
async function processAndDeleteMessage(message) {
  try {

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
  let biddingObject = JSON.parse(response.Messages[0].Body);
  let bidding = new Bid(biddingObject);
  await bidding.save(); 
  let emailBidData = {
    userEmail: biddingObject.user.email,
    userName: biddingObject.user.name,
    carName: biddingObject.car.carName,
    bidAmount: biddingObject.bidAmount,
    startDate: biddingObject.startDate,
    endDate: biddingObject.endDate,
    tripType: biddingObject.tripType,
    ownerName: biddingObject.owner.name,
    ownerEmail: biddingObject.owner.email,
    ownerPhone: biddingObject.owner.phone,
    carDetails: `${biddingObject.car.category} - ${biddingObject.car.numberPlate}`
};
  await sendBidAddedEmail(emailBidData);
  await processAndDeleteMessage(response.Messages[0]);
  return response;
};

// Export functions for use in other modules
module.exports = { getBidFromQueue }; 