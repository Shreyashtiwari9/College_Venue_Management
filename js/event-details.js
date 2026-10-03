const STUDENT_EVENT_API_URL = "/api";

let currentEvent = null;
let currentRegistration = null;




document.addEventListener("DOMContentLoaded", function () {

    const params =
        new URLSearchParams(window.location.search);

    const eventId =
        params.get("id");


    if (!eventId) {

        showError(
            "Event ID is missing. Please open the event from the Events page."
        );

        return;
    }


    loadEvent(eventId);

});




function getLoggedInUser() {

    try {

        const userData =
            localStorage.getItem("campusVenueUser");

        if (!userData) {
            return null;
        }

        return JSON.parse(userData);

    }

    catch (error) {

        console.error(
            "User data error:",
            error
        );

        return null;

    }

}




function getAuthToken() {

    return localStorage.getItem(
        "campusVenueToken"
    );

}




async function loadEvent(eventId) {

    try {

        const response =
            await fetch(
                `${STUDENT_EVENT_API_URL}/events/${encodeURIComponent(eventId)}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load event."
            );

        }


        currentEvent =
            data.event;


        displayEvent(
            currentEvent
        );




        await checkRegistration(
            eventId
        );

    }

    catch (error) {

        console.error(
            "Load Event Error:",
            error
        );


        showError(
            error.message ||
            "Unable to load event."
        );

    }

}




function displayEvent(event) {

    const loading =
        document.getElementById(
            "eventLoading"
        );

    const page =
        document.getElementById(
            "eventDetailsPage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (page) {

        page.style.display =
            "block";

    }


    setText(
        "eventTitle",
        event.title ||
        "Untitled Event"
    );


    setText(
        "eventDescription",
        event.description ||
        "No description available."
    );


    setText(
        "aboutEvent",
        event.description ||
        "No description available."
    );


    setText(
        "eventDate",
        formatDate(
            event.eventDate
        )
    );


    setText(
        "eventTime",
        formatTimeRange(
            event.startTime,
            event.endTime
        )
    );


    setText(
        "eventParticipants",
        event.expectedParticipants ||
        0
    );


    const venue =
        event.venue || {};


    setText(
        "venueCapacity",
        venue.capacity ||
        "N/A"
    );


    setText(
        "eventVenueName",
        venue.name ||
        "Venue not assigned"
    );


    setText(
        "eventVenueLocation",
        venue.location ||
        "Location not available"
    );


    const organizer =
        event.organizer || {};


    setText(
        "organizerName",
        organizer.name ||
        "Event Organizer"
    );


    setText(
        "organizerInfo",
        organizer.email ||
        "Organizer information unavailable"
    );


    const organizerAvatar =
        document.getElementById(
            "organizerAvatar"
        );


    if (organizerAvatar) {

        organizerAvatar.textContent =
            getInitials(
                organizer.name ||
                "Event Organizer"
            );

    }


    const status =
        normalizeStatus(
            event.status
        );


    const statusElement =
        document.getElementById(
            "eventStatus"
        );


    if (statusElement) {

        statusElement.textContent =
            status;


        statusElement.className =
            `status-badge ${getStatusClass(status)}`;

    }




    if (venue.name) {

        localStorage.setItem(
            "selectedVenue",
            venue.name
        );

    }


    updateCapacityInfo(
        event
    );

}




async function checkRegistration(eventId) {

    const token =
        getAuthToken();


    if (!token) {

        console.warn(
            "Authentication token not found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${STUDENT_EVENT_API_URL}/registrations/check/${encodeURIComponent(eventId)}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );




        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        if (data.success) {

            currentRegistration =
                data.registration ||
                null;


            if (
                data.registered === true ||
                (
                    currentRegistration &&
                    currentRegistration.status ===
                    "registered"
                )
            ) {

                showRegisteredState();

            }

        }

    }

    catch (error) {

        console.warn(
            "Registration check unavailable:",
            error.message
        );

    }

}




async function registerForEvent() {

    if (!currentEvent) {

        showToast(
            "Event information is not available.",
            "error"
        );

        return;

    }


    const token =
        getAuthToken();


    if (!token) {

        showToast(
            "Please login before registering.",
            "error"
        );

        setTimeout(
            function () {

                window.location.href =
                    "../login.html";

            },
            1200
        );

        return;

    }


    if (
        normalizeStatus(
            currentEvent.status
        ) !== "Approved"
    ) {

        showToast(
            "Only approved events can be registered.",
            "error"
        );

        return;

    }


    const registerButton =
        document.getElementById(
            "registerBtn"
        );


    if (registerButton) {

        registerButton.disabled =
            true;

        registerButton.textContent =
            "Registering...";

    }


    try {

        const response =
            await fetch(
                `${STUDENT_EVENT_API_URL}/registrations`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        eventId:
                            currentEvent._id

                    })

                }
            );


        const data =
            await response.json();


        console.log(
            "Registration Response:",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Registration failed."
            );

        }


        currentRegistration =
            data.registration ||
            null;


        showRegisteredState();


        showToast(
            data.message ||
            "Event registration successful.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Registration Error:",
            error
        );


        if (registerButton) {

            registerButton.disabled =
                false;

            registerButton.textContent =
                "Register";

        }


        showToast(
            error.message ||
            "Unable to register for this event.",
            "error"
        );

    }

}




function showRegisteredState() {

    const button =
        document.getElementById(
            "registerBtn"
        );


    const note =
        document.getElementById(
            "registeredNote"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Registered";

        button.classList.add(
            "registered"
        );

    }


    if (note) {

        note.style.display =
            "block";

        note.textContent =
            "You are registered for this event.";

    }

}




function viewVenue() {

    if (
        !currentEvent ||
        !currentEvent.venue
    ) {

        showToast(
            "Venue information is unavailable.",
            "error"
        );

        return;

    }


    const venue =
        currentEvent.venue;


    if (venue._id) {

        window.location.href =
            `venue-details.html?id=${encodeURIComponent(venue._id)}`;

        return;

    }


    localStorage.setItem(
        "selectedVenue",
        venue.name ||
        ""
    );


    window.location.href =
        "venue-details.html";

}




function goBack() {

    window.location.href =
    "event.html";

}




function updateCapacityInfo(event) {

    const participants =
        Number(
            event.expectedParticipants ||
            0
        );


    const capacity =
        Number(
            event.venue?.capacity ||
            0
        );


    const seatCount =
        document.getElementById(
            "seatCount"
        );


    const progressBar =
        document.getElementById(
            "progressBar"
        );


    const seatInfo =
        document.getElementById(
            "seatInfo"
        );


    if (seatCount) {

        seatCount.textContent =
            participants;

    }


    if (progressBar && capacity > 0) {

        const percentage =
            Math.min(
                (participants / capacity) * 100,
                100
            );


        progressBar.style.width =
            `${percentage}%`;

    }


    if (seatInfo) {

        if (capacity > 0) {

            seatInfo.textContent =
                `${participants} of ${capacity} expected participants`;

        }

        else {

            seatInfo.textContent =
                `${participants} expected participants`;

        }

    }

}




function showError(message) {

    const loading =
        document.getElementById(
            "eventLoading"
        );


    const page =
        document.getElementById(
            "eventDetailsPage"
        );


    const errorBox =
        document.getElementById(
            "eventError"
        );


    const errorMessage =
        document.getElementById(
            "eventErrorMessage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (page) {

        page.style.display =
            "none";

    }


    if (errorBox) {

        errorBox.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}




function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}




function formatDate(dateValue) {

    if (!dateValue) {

        return "Date not available";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Invalid date";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}




function formatTimeRange(
    startTime,
    endTime
) {

    return `
        ${formatTime(startTime)}
        -
        ${formatTime(endTime)}
    `.trim();

}


function formatTime(timeValue) {

    if (!timeValue) {

        return "--";

    }


    const parts =
        String(timeValue).split(":");


    if (parts.length < 2) {

        return timeValue;

    }


    let hours =
        Number(parts[0]);


    const minutes =
        parts[1];


    const suffix =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12 ||
        12;


    return `${hours}:${minutes} ${suffix}`;

}




function normalizeStatus(status) {

    if (!status) {

        return "Pending";

    }


    return String(status)
        .charAt(0)
        .toUpperCase() +
        String(status).slice(1).toLowerCase();

}


function getStatusClass(status) {

    const normalized =
        String(status).toLowerCase();


    switch (normalized) {

        case "approved":
            return "approved";

        case "pending":
            return "pending";

        case "rejected":
            return "rejected";

        case "cancelled":
            return "cancelled";

        default:
            return "pending";

    }

}




function getInitials(name) {

    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
                    .toUpperCase()
        )
        .join("");

}




function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        alert(message);

        return;

    }


    toast.textContent =
        message;


    toast.className =
        `toast ${type}`;


    toast.classList.add(
        "show"
    );


    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}




window.registerForEvent =
    registerForEvent;

window.viewVenue =
    viewVenue;

window.goBack =
    goBack;