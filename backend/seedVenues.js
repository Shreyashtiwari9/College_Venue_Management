const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Venue = require("./models/Venue");

dotenv.config();

const venues = [
    {
        name: "New Seminar Hall",
        location: "College Campus",
        capacity: 135,
        description: "Seminar hall for college events, presentations and academic programs.",
        facilities: [
            "Projector",
            "Sound System",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Old Seminar Hall",
        location: "College Campus",
        capacity: 120,
        description: "Seminar hall for meetings, presentations and college programs.",
        facilities: [
            "Projector",
            "Sound System",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Dronacharya",
        location: "College Campus",
        capacity: 120,
        description: "College venue for academic, cultural and student events.",
        facilities: [
            "Projector",
            "Sound System",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Chanakya",
        location: "College Campus",
        capacity: 580,
        description: "Large college venue for major events, seminars and programs.",
        facilities: [
            "Projector",
            "Sound System",
            "AC",
            "Stage",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Lab 1",
        location: "College Campus",
        capacity: 60,
        description: "UG Lab for practical sessions, technical workshops and academic activities.",
        facilities: [
            "Computers",
            "Projector",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Lab 2",
        location: "College Campus",
        capacity: 60,
        description: "UG Lab for practical sessions, technical workshops and academic activities.",
        facilities: [
            "Computers",
            "Projector",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Lab 3",
        location: "College Campus",
        capacity: 60,
        description: "PG Lab for practical sessions, technical workshops and academic activities.",
        facilities: [
            "Computers",
            "Projector",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Lab 4",
        location: "College Campus",
        capacity: 60,
        description: "PG Lab for practical sessions, technical workshops and academic activities.",
        facilities: [
            "Computers",
            "Projector",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Lab 5",
        location: "College Campus",
        capacity: 60,
        description: "PG Lab for practical sessions, technical workshops and academic activities.",
        facilities: [
            "Computers",
            "Projector",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    },

    {
        name: "Lab 6",
        location: "College Campus",
        capacity: 60,
        description: "PG Lab for practical sessions, technical workshops and academic activities.",
        facilities: [
            "Computers",
            "Projector",
            "AC",
            "Wi-Fi"
        ],
        status: "available"
    }
];

const seedVenues = async () => {
    try {
        await connectDB();

        console.log("MongoDB connected.");

        const seedResults = await Promise.all(
            venues.map((venue) => Venue.updateOne(
                { name: venue.name },
                { $setOnInsert: venue },
                { upsert: true }
            ))
        );

        const insertedCount = seedResults.reduce(
            (total, result) => total + result.upsertedCount,
            0
        );

        console.log(
            `${insertedCount} missing venues inserted; existing records preserved.`
        );

        console.log("====================================");
        console.log("VENUE SEEDING COMPLETED");
        console.log("====================================");

        process.exit(0);

    } catch (error) {
        console.error(
            "Venue seeding failed:",
            error.message
        );

        process.exit(1);
    }
};

seedVenues();