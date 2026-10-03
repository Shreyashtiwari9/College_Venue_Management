const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing from backend/.env");
    }

    let attempt = 0;

    while (mongoose.connection.readyState !== 1) {
        attempt += 1;

        try {
            const connection = await mongoose.connect(
                process.env.MONGO_URI,
                { serverSelectionTimeoutMS: 10000 }
            );

            console.log("====================================");
            console.log("MongoDB Connected Successfully");
            console.log("====================================");
            console.log(`Database: ${connection.connection.name}`);

            return;
        } catch (error) {
            const retryDelay = Math.min(1000 * (2 ** (attempt - 1)), 30000);

            console.error(
                `MongoDB connection attempt ${attempt} failed: ${error.message}`
            );
            console.log(`Retrying MongoDB connection in ${retryDelay / 1000} seconds.`);

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
};


module.exports = connectDB;

