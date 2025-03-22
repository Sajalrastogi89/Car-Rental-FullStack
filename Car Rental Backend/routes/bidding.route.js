const express = require("express");
const{addBid, acceptBid, rejectBid, getAllBids} = require("../controllers/bidding.controller");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles = require("../middlewares/roleAuthenticate");
const validateBidDetails=require("../middlewares/validateBid");

/**
 * @swagger
 * components:
 *   schemas:
 *     CarSubModel:
 *       type: object
 *       required:
 *         - _id
 *         - carName
 *         - category
 *         - fuelType
 *         - basePrice
 *         - pricePerKm
 *         - outStationCharges
 *         - city
 *         - imageUrl
 *         - selectedFeatures
 *       properties:
 *         _id:
 *           type: string
 *           description: Car ID
 *         carName:
 *           type: string
 *           description: Name of the car
 *         category:
 *           type: string
 *           description: Car category
 *         fuelType:
 *           type: string
 *           description: Type of fuel used
 *         basePrice:
 *           type: number
 *           description: Base price for rental
 *         pricePerKm:
 *           type: number
 *           description: Price charged per kilometer
 *         outStationCharges:
 *           type: number
 *           description: Additional charges for outstation trips
 *         travelled:
 *           type: number
 *           description: Total kilometers travelled by the car
 *         city:
 *           type: string
 *           description: City where the car is available
 *         imageUrl:
 *           type: string
 *           description: URL to car's image
 *         selectedFeatures:
 *           type: array
 *           items:
 *             type: string
 *           description: Special features of the car
 *     
 *     UserSubModel:
 *       type: object
 *       required:
 *         - _id
 *         - name
 *         - email
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         role:
 *           type: string
 *           description: User's role
 *     
 *     BidInput:
 *       type: object
 *       required:
 *         - bidAmount
 *         - startDate
 *         - endDate
 *         - carId
 *       properties:
 *         bidAmount:
 *           type: number
 *           description: Amount proposed for the bid
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of rental period
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of rental period
 *         carId:
 *           type: string
 *           description: ID of the car being bid on
 *     
 *     Bid:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Bid ID
 *         bidAmount:
 *           type: number
 *           description: Amount proposed for the bid
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of rental period
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of rental period
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           description: Current status of the bid
 *         car:
 *           $ref: '#/components/schemas/CarSubModel'
 *         user:
 *           $ref: '#/components/schemas/UserSubModel'
 *         owner:
 *           $ref: '#/components/schemas/UserSubModel'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the bid was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the bid was last updated
 *     
 *     BookingDetails:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Booking ID
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of rental period
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of rental period
 *         totalAmount:
 *           type: number
 *           description: Total amount for the booking
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           description: Current status of the booking
 *         car:
 *           $ref: '#/components/schemas/CarSubModel'
 *         user:
 *           $ref: '#/components/schemas/UserSubModel'
 *         owner:
 *           $ref: '#/components/schemas/UserSubModel'
 *         bidId:
 *           type: string
 *           description: Reference to the original bid
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the booking was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the booking was last updated
 *     
 *     AcceptBidResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Bid accepted and booking created
 *         data:
 *           $ref: '#/components/schemas/BookingDetails'
 * 
 *     PaginationMetadata:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of items
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *     
 *     PaginatedBidsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Bids retrieved successfully
 *         metadata:
 *           $ref: '#/components/schemas/PaginationMetadata'
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Bid'
 */

const router=express.Router();

/**
 * @swagger
 * /api/bidding/getAllBids:
 *   get:
 *     summary: Get all bids with filtering, sorting and pagination
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: Filter bids by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter bids by car category
 *       - in: query
 *         name: bidAmount
 *         schema:
 *           type: number
 *         description: Filter bids by exact bid amount
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, bidAmount, startDate, endDate]
 *           default: createdAt
 *         description: Field to sort results by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: number
 *           enum: [1, -1]
 *           default: -1
 *         description: Sort order (1 for ascending, -1 for descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of filtered bids with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedBidsResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires owner role
 *       500:
 *         description: Server error
 */
router.get("/getAllBids", authenticateJWT,  getAllBids);

/**
 * @swagger
 * /api/bidding/addBidding:
 *   post:
 *     summary: Add a new bid on a car
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BidInput'
 *     responses:
 *       201:
 *         description: Bid created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bid'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires user role
 *       500:
 *         description: Server error
 */
router.post("/addBidding", authenticateJWT, authorizeRoles("user"), validateBidDetails, addBid);

/**
 * @swagger
 * /api/bidding/acceptBid/{id}:
 *   post:
 *     summary: Accept a bid and create a booking
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the bid to accept
 *     responses:
 *       201:
 *         description: Bid accepted and booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcceptBidResponse'
 *       400:
 *         description: Invalid bid ID or bid already processed
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires owner role
 *       404:
 *         description: Bid not found
 *       500:
 *         description: Server error
 */
router.post("/acceptBid/:id", authenticateJWT, authorizeRoles("owner"), acceptBid);

/**
 * @swagger
 * /api/bidding/rejectBid/{id}:
 *   put:
 *     summary: Reject a bid
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the bid to reject
 *     responses:
 *       200:
 *         description: Bid rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bid'
 *       400:
 *         description: Invalid bid ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires owner role
 *       404:
 *         description: Bid not found
 *       500:
 *         description: Server error
 */
router.patch("/rejectBid/:id", authenticateJWT, authorizeRoles("owner"), rejectBid);

module.exports=router;