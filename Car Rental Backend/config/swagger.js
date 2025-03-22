const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "EZYCAR",
      version: "0.1.0",
      description:
        "EZYCAR application backend APIS",
      contact: {
        name: "Sajal Rastogi",
        url: "https://ezycarrental.com",
        email: "Sajalrastogii89@gmail.com",
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: [path.resolve(__dirname, "../routes/*.js")],
};

const specs = swaggerJsdoc(options);

module.exports = specs;