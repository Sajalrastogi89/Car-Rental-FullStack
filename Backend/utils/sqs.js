const AWS = require('aws-sdk');
const Bid = require('../models/bidding.model');

const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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

const sendBidToQueue = async (bidData) => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(bidData),
  };

  const response = await awsSendMessage(sqs, params);

  return response;
};

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

async function processAndDeleteMessage(message) {
  try {
    // Process the message (parse the bid data and save to DB)
    const bidData = JSON.parse(message.Body);
    console.log('Processing bid data:', bidData);

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


const getBidFromQueue = async () => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MaxNumberOfMessages: 1,
  };

  const response = await awsReceiveMessage(sqs, params);
  if (!response.Messages || response.Messages.length === 0) {
    return [];
  }

  let biddingObject=JSON.parse(response.Messages[0].Body);
  let bidding = new Bid(biddingObject);
  await bidding.save(); 

  await processAndDeleteMessage(response.Messages[0]);

  return response;
};

module.exports = { sendBidToQueue, getBidFromQueue };
