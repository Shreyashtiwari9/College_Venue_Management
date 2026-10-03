const Attendance = require("../models/Attendance");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const User = require("../models/User");

const getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required."
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (
            req.user.role !== "admin" &&
            String(event.organizer) !== String(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this attendance."
            });
        }

        const registrations =
            await EventRegistration.find({
                event: eventId,
                status: "registered"
            })
            .populate(
                "student",
                "name collegeId email department year"
            )
            .sort({ createdAt: 1 });

        const attendance =
            await Attendance.find({
                event: eventId
            });

        const attendanceMap = new Map();

        attendance.forEach(function (record) {
            attendanceMap.set(
                String(record.student),
                record.status
            );
        });

        const students = registrations
            .filter(function (registration) {
                return registration.student;
            })
            .map(function (registration) {
                const student = registration.student;

                return {
                    registrationId: registration._id,
                    studentId: student._id,
                    name: student.name,
                    collegeId: student.collegeId,
                    email: student.email,
                    department: student.department,
                    year: student.year,
                    status:
                        attendanceMap.get(
                            String(student._id)
                        ) || "absent"
                };
            });

        const presentCount =
            students.filter(function (student) {
                return student.status === "present";
            }).length;

        const absentCount =
            students.length - presentCount;

        return res.status(200).json({
            success: true,
            event: {
                id: event._id,
                title: event.title,
                eventDate: event.eventDate,
                startTime: event.startTime,
                endTime: event.endTime
            },
            totalStudents: students.length,
            presentCount,
            absentCount,
            students
        });

    } catch (error) {
        console.error(
            "Get Event Attendance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load attendance.",
            error: error.message
        });
    }
};


const markAttendance = async (req, res) => {
    try {
        const { eventId, studentId, status } = req.body;

        if (!eventId || !studentId || !status) {
            return res.status(400).json({
                success: false,
                message:
                    "Event ID, student ID and attendance status are required."
            });
        }

        if (
            status !== "present" &&
            status !== "absent"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance status must be present or absent."
            });
        }

        const event =
            await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (
            req.user.role !== "admin" &&
            String(event.organizer) !== String(req.user.userId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to mark attendance for this event."
            });
        }

        const student =
            await User.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        if (student.role !== "student") {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance can only be marked for students."
            });
        }

        const registration =
            await EventRegistration.findOne({
                event: eventId,
                student: studentId,
                status: "registered"
            });

        if (!registration) {
            return res.status(400).json({
                success: false,
                message:
                    "This student is not registered for this event."
            });
        }

        const attendance =
            await Attendance.findOneAndUpdate(
                {
                    event: eventId,
                    student: studentId
                },
                {
                    event: eventId,
                    student: studentId,
                    status: status,
                    markedBy: req.user.userId,
                    markedAt: new Date()
                },
                {
                    returnDocument: "after",
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

        return res.status(200).json({
            success: true,
            message:
                status === "present"
                    ? "Student marked present."
                    : "Student marked absent.",
            attendance
        });

    } catch (error) {
        console.error(
            "Mark Attendance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to mark attendance.",
            error: error.message
        });
    }
};


const getMyAttendance = async (req, res) => {
    try {
        const studentId =
            req.user.userId;

        const registrations =
            await EventRegistration.find({
                student: studentId
            })
            .populate({
                path: "event",
                populate: {
                    path: "venue",
                    select: "name location capacity"
                }
            })
            .sort({ createdAt: -1 });

        const attendanceRecords =
            await Attendance.find({
                student: studentId
            });

        const attendanceMap = new Map();

        attendanceRecords.forEach(function (record) {
            attendanceMap.set(
                String(record.event),
                record.status
            );
        });

        const events = registrations
            .filter(function (registration) {
                return registration.event;
            })
            .map(function (registration) {
                const event =
                    registration.event;

                const status =
                    attendanceMap.get(
                        String(event._id)
                    ) || "not-marked";

                return {
                    eventId: event._id,
                    title: event.title,
                    eventDate: event.eventDate,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    venue: event.venue,
                    registrationStatus:
                        registration.status,
                    attendanceStatus: status
                };
            });

        const presentCount =
            events.filter(function (event) {
                return event.attendanceStatus === "present";
            }).length;

        const absentCount =
            events.filter(function (event) {
                return event.attendanceStatus === "absent";
            }).length;

        const markedCount =
            presentCount + absentCount;

        return res.status(200).json({
            success: true,
            totalEvents: events.length,
            markedCount,
            presentCount,
            absentCount,
            events
        });

    } catch (error) {
        console.error(
            "Get My Attendance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load your attendance.",
            error: error.message
        });
    }
};


module.exports = {
    getEventAttendance,
    markAttendance,
    getMyAttendance
};