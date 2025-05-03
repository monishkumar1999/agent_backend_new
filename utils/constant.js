require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const jwt_secret_key = process.env.JWT_SECRATE;

module.exports={
    jwt_secret_key
}