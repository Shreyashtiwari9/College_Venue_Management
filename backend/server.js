const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const User = require("./models/User");
const Event = require("./models/Event");
const Venue = require("./models/Venue");
const EventRegistration = require("./models/EventRegistration");

const authRoutes = require("./routes/authRoutes");
const venueRoutes = require("./routes/venueRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const venueRequestRoutes = require("./routes/venueRequestRoutes");
const equipmentRequestRoutes = require("./routes/equipmentRequestRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");


const app = express();


const PORT =
    process.env.PORT || 5000;


const frontendPath =
    path.resolve(
        __dirname,
        ".."
    );


app.use(
    cors()
);


app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended: true
    })
);


app.use(
    express.static(
        frontendPath,
        {
            extensions: ["html"]
        }
    )
);


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/venues",
    venueRoutes
);


app.use(
    "/api/events",
    eventRoutes
);


app.use(
    "/api/registrations",
    registrationRoutes
);


app.use(
    "/api/notifications",
    notificationRoutes
);


app.use(
    "/api/attendance",
    attendanceRoutes
);


app.use(
    "/api/admin",
    adminRoutes
);


app.use(
    "/api/venue-requests",
    venueRequestRoutes
);


app.use(
    "/api/equipment-requests",
    equipmentRequestRoutes
);


app.use(
    "/api/volunteers",
    volunteerRoutes
);


app.use(
    "/api/feedback",
    feedbackRoutes
);


app.get(
    "/api/health",
    function (req, res) {

        res.status(200).json({

            success: true,

            server: "online",

            message:
                "CampusVenue Backend API is running.",

            database:
                "MongoDB connection attempted"

        });

    }
);


app.get(
    "/api",
    function (req, res) {

        res.status(200).json({

            success: true,

            message:
                "CampusVenue API is working."

        });

    }
);


app.get(
    "/student/events.html",
    function (req, res) {

        res.sendFile(
            path.join(
                frontendPath,
                "student",
                "event.html"
            )
        );

    }
);


app.get(
    "/student/venues.html",
    function (req, res) {

        res.sendFile(
            path.join(
                frontendPath,
                "student",
                "venues.html"
            )
        );

    }
);


app.get(
    "/student/dashboard.html",
    function (req, res) {

        res.sendFile(
            path.join(
                frontendPath,
                "student",
                "dashboard.html"
            )
        );

    }
);


app.get(
    "/api/public/stats",
    async function (req, res) {

        try {

            const [
                events,
                venues,
                students,
                successfulEvents,
                participants,
                featuredEvent
            ] =
                await Promise.all([

                    Event.countDocuments(),

                    Venue.countDocuments(),

                    User.countDocuments({
                        role: "student",
                        isActive: true
                    }),

                    Event.countDocuments({
                        status: "approved"
                    }),

                    EventRegistration.countDocuments({
                        status: "registered"
                    }),

                    Event.findOne({
                        status: "approved",
                        eventDate: { $gte: new Date() }
                    })
                        .select("title eventDate category startTime")
                        .populate("venue", "name")
                        .sort({ eventDate: 1 })
                        .lean()

                ]);


            const successRate =
                events > 0
                    ? Math.round(
                        (
                            successfulEvents /
                            events
                        ) * 100
                    )
                    : 0;


            return res.status(200).json({

                success: true,

                stats: {

                    events,

                    venues,

                    students,

                    participants,

                    featuredEvent,

                    successRate

                }

            });

        } catch (error) {

            console.error(
                "Public Stats Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load public statistics."

            });

        }

    }
);


async function startServer() {

    try {

        await connectDB();


        app.listen(
            PORT,
            function () {

                console.log(
                    "===================================="
                );

                console.log(
                    "CampusVenue Backend"
                );

                console.log(
                    "===================================="
                );

                console.log(
                    `Server running on port ${PORT}`
                );

                console.log(
                    `http://localhost:${PORT}`
                );

                console.log(
                    `Frontend path: ${frontendPath}`
                );

                console.log(
                    "===================================="
                );

            }
        );

    } catch (error) {

        console.error(
            "Backend startup failed:",
            error.message
        );

        process.exit(1);

    }

}


startServer();
