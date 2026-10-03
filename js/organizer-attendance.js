const ATTENDANCE_API_URL = "/api";

let organizerEvents = [];
let attendanceStudents = [];
let selectedEventId = "";

document.addEventListener("DOMContentLoaded", function () {
    initializeAttendancePage();
});

function getAuthToken() {
    return localStorage.getItem("campusVenueToken");
}

async function initializeAttendancePage() {
    const token = getAuthToken();

    if (!token) {
        showAttendanceError("Please login again.");
        return;
    }

    setupEventSelector();
    setupStudentSearch();

    await loadOrganizerEvents();

    const params = new URLSearchParams(window.location.search);
    const eventIdFromUrl = params.get("eventId");

    if (eventIdFromUrl) {
        const select = document.getElementById("eventSelect");

        if (select) {
            select.value = eventIdFromUrl;

            selectedEventId = eventIdFromUrl;

            const event = organizerEvents.find(function (item) {
                return String(item._id) === String(eventIdFromUrl);
            });

            if (event) {
                displayEventInformation(event);
                await loadEventAttendance(eventIdFromUrl);
            }
        }
    }
}

async function loadOrganizerEvents() {
    const loading = document.getElementById("attendanceLoading");
    const errorBox = document.getElementById("attendanceError");

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
    }

    try {
        const token = getAuthToken();

        const userData =
            localStorage.getItem("campusVenueUser");

        if (!userData) {
            throw new Error("User information not found.");
        }

        const user = JSON.parse(userData);

        const organizerId =
            user.id ||
            user._id ||
            user.userId;

        if (!organizerId) {
            throw new Error("Organizer information not found.");
        }

        const response = await fetch(
            `${ATTENDANCE_API_URL}/events/organizer/${encodeURIComponent(organizerId)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load your events."
            );
        }

        organizerEvents =
            Array.isArray(data.events)
                ? data.events
                : [];

        populateEventSelector();

    } catch (error) {
        console.error(
            "Load Organizer Events Error:",
            error
        );

        showAttendanceError(
            error.message ||
            "Unable to load events."
        );

    } finally {
        if (loading) {
            loading.style.display = "none";
        }
    }
}

function populateEventSelector() {
    const select =
        document.getElementById("eventSelect");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select an event
        </option>
    `;

    organizerEvents.forEach(function (event) {
        const option =
            document.createElement("option");

        option.value = event._id;

        option.textContent =
            event.title ||
            "Untitled Event";

        select.appendChild(option);
    });
}

function setupEventSelector() {
    const select =
        document.getElementById("eventSelect");

    if (!select) {
        return;
    }

    select.addEventListener(
        "change",
        async function () {
            selectedEventId = this.value;

            if (!selectedEventId) {
                hideAttendanceContent();
                return;
            }

            const event =
                organizerEvents.find(
                    function (item) {
                        return String(item._id) ===
                            String(selectedEventId);
                    }
                );

            if (event) {
                displayEventInformation(event);
            }

            await loadEventAttendance(
                selectedEventId
            );
        }
    );
}

function displayEventInformation(event) {
    setElementText(
        "eventTitle",
        event.title ||
        "Untitled Event"
    );

    setElementText(
        "eventDate",
        formatDate(event.eventDate)
    );

    setElementText(
        "eventTime",
        `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
    );
}

async function loadEventAttendance(eventId) {
    const content =
        document.getElementById(
            "attendanceContent"
        );

    const studentsLoading =
        document.getElementById(
            "studentsLoading"
        );

    const tableWrapper =
        document.getElementById(
            "studentsTableWrapper"
        );

    const empty =
        document.getElementById(
            "studentsEmpty"
        );

    try {
        if (content) {
            content.style.display = "block";
        }

        if (studentsLoading) {
            studentsLoading.style.display = "block";
        }

        if (tableWrapper) {
            tableWrapper.style.display = "none";
        }

        if (empty) {
            empty.style.display = "none";
        }

        const token = getAuthToken();

        if (!token) {
            handleUnauthorized();
            return;
        }

        const response = await fetch(
            `${ATTENDANCE_API_URL}/attendance/event/${encodeURIComponent(eventId)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data =
            await response.json();

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load attendance."
            );
        }

        attendanceStudents =
            Array.isArray(data.students)
                ? data.students.map(normalizeStudent)
                : [];

        setElementText(
            "totalStudents",
            data.totalStudents ||
            attendanceStudents.length
        );

        setElementText(
            "presentCount",
            data.presentCount ||
            0
        );

        setElementText(
            "absentCount",
            data.absentCount ||
            0
        );

        renderStudents(
            attendanceStudents
        );

    } catch (error) {
        console.error(
            "Load Attendance Error:",
            error
        );

        showAttendanceError(
            error.message ||
            "Unable to load attendance."
        );

    } finally {
        if (studentsLoading) {
            studentsLoading.style.display = "none";
        }
    }
}

function normalizeStudent(student) {
    const user =
        student.student ||
        student.user ||
        student;

    return {
        studentId:
            student.studentId ||
            student.student?._id ||
            student.student?.id ||
            user._id ||
            user.id ||
            "",

        name:
            student.name ||
            student.studentName ||
            student.student?.name ||
            user.name ||
            "Unknown Student",

        collegeId:
            student.collegeId ||
            student.student?.collegeId ||
            user.collegeId ||
            "--",

        email:
            student.email ||
            student.student?.email ||
            user.email ||
            "",

        department:
            student.department ||
            student.student?.department ||
            user.department ||
            "--",

        year:
            student.year ||
            student.student?.year ||
            user.year ||
            "--",

        status:
            student.status ||
            student.attendanceStatus ||
            "absent"
    };
}

function renderStudents(students) {
    const tableWrapper =
        document.getElementById(
            "studentsTableWrapper"
        );

    const tableBody =
        document.getElementById(
            "studentsTableBody"
        );

    const empty =
        document.getElementById(
            "studentsEmpty"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!students || students.length === 0) {
        if (tableWrapper) {
            tableWrapper.style.display = "none";
        }

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (tableWrapper) {
        tableWrapper.style.display = "block";
    }

    students.forEach(function (student) {
        const row =
            createStudentRow(student);

        tableBody.appendChild(row);
    });
}

function createStudentRow(student) {
    const row =
        document.createElement("tr");

    const status =
        student.status === "present"
            ? "present"
            : "absent";

    row.innerHTML = `
        <td>
            <div class="student-name">
                <span class="student-avatar">
                    ${escapeHTML(
                        getInitials(student.name)
                    )}
                </span>

                <div>
                    <strong>
                        ${escapeHTML(
                            student.name ||
                            "Unknown Student"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            student.email ||
                            ""
                        )}
                    </small>
                </div>
            </div>
        </td>

        <td>
            ${escapeHTML(
                student.collegeId ||
                "--"
            )}
        </td>

        <td>
            ${escapeHTML(
                student.department ||
                "--"
            )}
        </td>

        <td>
            ${escapeHTML(
                student.year ||
                "--"
            )}
        </td>

        <td>
            <div class="attendance-buttons">

                <button
                    type="button"
                    class="attendance-btn present-btn ${
                        status === "present"
                            ? "active"
                            : ""
                    }"
                    onclick="markStudentAttendance(
                        '${student.studentId}',
                        'present'
                    )"
                >
                    <i class="bi bi-check-lg"></i>
                    Present
                </button>

                <button
                    type="button"
                    class="attendance-btn absent-btn ${
                        status === "absent"
                            ? "active"
                            : ""
                    }"
                    onclick="markStudentAttendance(
                        '${student.studentId}',
                        'absent'
                    )"
                >
                    <i class="bi bi-x-lg"></i>
                    Absent
                </button>

            </div>
        </td>
    `;

    return row;
}

async function markStudentAttendance(
    studentId,
    status
) {
    if (!selectedEventId || !studentId) {
        return;
    }

    try {
        const token = getAuthToken();

        if (!token) {
            handleUnauthorized();
            return;
        }

        const response = await fetch(
            `${ATTENDANCE_API_URL}/attendance/mark`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    eventId: selectedEventId,
                    studentId: studentId,
                    status: status
                })
            }
        );

        const data =
            await response.json();

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to mark attendance."
            );
        }

        updateLocalStudentStatus(
            studentId,
            status
        );

        renderStudents(
            getFilteredStudents()
        );

        updateAttendanceCounts();

        showAttendanceToast(
            status === "present"
                ? "Student marked present."
                : "Student marked absent."
        );

    } catch (error) {
        console.error(
            "Mark Attendance Error:",
            error
        );

        showAttendanceToast(
            error.message ||
            "Unable to update attendance."
        );
    }
}

function updateLocalStudentStatus(
    studentId,
    status
) {
    attendanceStudents =
        attendanceStudents.map(
            function (student) {

                if (
                    String(student.studentId) ===
                    String(studentId)
                ) {
                    return {
                        ...student,
                        status: status
                    };
                }

                return student;
            }
        );
}

function updateAttendanceCounts() {
    const total =
        attendanceStudents.length;

    const present =
        attendanceStudents.filter(
            function (student) {
                return student.status === "present";
            }
        ).length;

    const absent =
        total - present;

    setElementText(
        "totalStudents",
        total
    );

    setElementText(
        "presentCount",
        present
    );

    setElementText(
        "absentCount",
        absent
    );
}

function setupStudentSearch() {
    const search =
        document.getElementById(
            "studentSearch"
        );

    if (!search) {
        return;
    }

    search.addEventListener(
        "input",
        function () {
            renderStudents(
                getFilteredStudents()
            );
        }
    );
}

function getFilteredStudents() {
    const search =
        document.getElementById(
            "studentSearch"
        );

    if (!search) {
        return attendanceStudents;
    }

    const query =
        search.value
            .trim()
            .toLowerCase();

    if (!query) {
        return attendanceStudents;
    }

    return attendanceStudents.filter(
        function (student) {

            return (
                String(
                    student.name ||
                    ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    student.collegeId ||
                    ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    student.email ||
                    ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    student.department ||
                    ""
                )
                    .toLowerCase()
                    .includes(query)
            );
        }
    );
}

function hideAttendanceContent() {
    const content =
        document.getElementById(
            "attendanceContent"
        );

    if (content) {
        content.style.display = "none";
    }

    attendanceStudents = [];

    setElementText(
        "totalStudents",
        0
    );

    setElementText(
        "presentCount",
        0
    );

    setElementText(
        "absentCount",
        0
    );
}

function showAttendanceError(message) {
    const errorBox =
        document.getElementById(
            "attendanceError"
        );

    if (!errorBox) {
        return;
    }

    errorBox.textContent =
        message ||
        "Unable to load attendance.";

    errorBox.style.display = "block";
}

function showAttendanceToast(message) {
    const toast =
        document.getElementById(
            "attendanceToast"
        );

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.classList.add("show");

    setTimeout(
        function () {
            toast.classList.remove("show");
        },
        2500
    );
}

function handleUnauthorized() {
    localStorage.removeItem(
        "campusVenueToken"
    );

    localStorage.removeItem(
        "campusVenueUser"
    );

    localStorage.removeItem(
        "campusVenueRole"
    );

    alert(
        "Your login session has expired. Please login again."
    );

    window.location.href =
        "../login.html";
}

function setElementText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatDate(value) {
    if (!value) {
        return "--";
    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatTime(value) {
    if (!value) {
        return "--";
    }

    const parts =
        String(value).split(":");

    if (parts.length < 2) {
        return value;
    }

    let hour =
        parseInt(
            parts[0],
            10
        );

    const minute =
        parts[1];

    if (isNaN(hour)) {
        return value;
    }

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}

function getInitials(name) {
    if (!name) {
        return "?";
    }

    const words =
        String(name)
            .trim()
            .split(/\s+/);

    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.markStudentAttendance =
    markStudentAttendance;