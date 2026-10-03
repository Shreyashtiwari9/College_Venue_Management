const CREATE_EVENT_API_BASE_URL = "/api";

const eventForm = document.getElementById("eventForm");
const eventName = document.getElementById("eventName");
const category = document.getElementById("category");
const participants = document.getElementById("participants");
const date = document.getElementById("date");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");
const venue = document.getElementById("venue");
const organizer = document.getElementById("organizer");
const description = document.getElementById("description");
const requirements = document.getElementById("requirements");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");
const capacityInfo = document.getElementById("capacityInfo");

let availableVenues = [];

function getLoggedInUser() {
    try {
        const userData =
            localStorage.getItem("campusVenueUser");

        if (!userData) {
            return null;
        }

        return JSON.parse(userData);
    } catch (error) {
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

function setMinimumDate() {
    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    date.min =
        `${year}-${month}-${day}`;
}

function loadOrganizer() {
    const user =
        getLoggedInUser();

    if (!user) {
        showMessage(
            "Please login again.",
            "error"
        );

        return;
    }

    organizer.value =
        user.name ||
        user.email ||
        "Logged-in Organizer";
}

function getParticipantRange(selectedVenue) {
    const isLab =
        /^Lab\s[1-6]$/i.test(
            selectedVenue.name.trim()
        );

    if (isLab) {
        return {
            min: selectedVenue.capacity,
            max: selectedVenue.capacity,
            isLab: true
        };
    }

    return {
        min:
            Math.floor(
                selectedVenue.capacity * 0.9
            ),

        max:
            Math.ceil(
                selectedVenue.capacity * 1.1
            ),

        isLab: false
    };
}

async function loadVenues() {
    try {
        venue.innerHTML = `
            <option value="">
                Loading venues...
            </option>
        `;

        const response =
            await fetch(
                `${CREATE_EVENT_API_BASE_URL}/venues`
            );

        const data =
            await response.json();

        console.log(
            "Venue API Response:",
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Failed to load venues"
            );
        }

        availableVenues =
            Array.isArray(data.venues)
                ? data.venues.filter(
                    function (item) {
                        return (
                            (item.availability || item.status) ===
                            "available"
                        );
                    }
                )
                : [];

        renderVenueOptions();

    } catch (error) {
        console.error(
            "Load Venues Error:",
            error
        );

        venue.innerHTML = `
            <option value="">
                Unable to load venues
            </option>
        `;

        showMessage(
            "Unable to load venues. Please refresh the page.",
            "error"
        );
    }
}

function renderVenueOptions() {
    venue.innerHTML = "";

    const defaultOption =
        document.createElement(
            "option"
        );

    defaultOption.value = "";

    defaultOption.textContent =
        "Select Venue";

    venue.appendChild(
        defaultOption
    );

    if (
        availableVenues.length === 0
    ) {
        const option =
            document.createElement(
                "option"
            );

        option.value = "";

        option.textContent =
            "No available venues";

        option.disabled = true;

        venue.appendChild(
            option
        );

        return;
    }

    availableVenues.forEach(
        function (item) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item._id;

            option.textContent =
                `${item.name} — Capacity ${item.capacity}`;

            venue.appendChild(
                option
            );
        }
    );
}

venue.addEventListener(
    "change",
    function () {
        const selectedVenue =
            availableVenues.find(
                function (item) {
                    return (
                        item._id ===
                        venue.value
                    );
                }
            );

        if (!selectedVenue) {
            capacityInfo.textContent = "";

            participants.removeAttribute(
                "min"
            );

            participants.removeAttribute(
                "max"
            );

            return;
        }

        const range =
            getParticipantRange(
                selectedVenue
            );

        participants.min =
            range.min;

        participants.max =
            range.max;

        if (range.isLab) {
            capacityInfo.textContent =
                `Lab capacity: ${selectedVenue.capacity} participants. Exactly ${selectedVenue.capacity} participants are allowed.`;
        } else {
            capacityInfo.textContent =
                `Venue capacity: ${selectedVenue.capacity} participants. Allowed range: ${range.min}–${range.max} participants (±10%).`;
        }

        const currentValue =
            Number(
                participants.value
            );

        if (
            currentValue &&
            (
                currentValue <
                range.min ||
                currentValue >
                range.max
            )
        ) {
            participants.value = "";
        }
    }
);

eventForm.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        const user =
            getLoggedInUser();

        const token =
            getAuthToken();

        if (!user || !token) {
            showMessage(
                "Your login session has expired. Please login again.",
                "error"
            );

            return;
        }

        const selectedVenue =
            availableVenues.find(
                function (item) {
                    return (
                        item._id ===
                        venue.value
                    );
                }
            );

        if (!selectedVenue) {
            showMessage(
                "Please select a valid available venue.",
                "error"
            );

            return;
        }

        const participantCount =
            Number(
                participants.value
            );

        if (
            !Number.isFinite(
                participantCount
            ) ||
            participantCount < 1
        ) {
            showMessage(
                "Expected participants must be at least 1.",
                "error"
            );

            return;
        }

        const range =
            getParticipantRange(
                selectedVenue
            );

        if (
            participantCount <
            range.min ||
            participantCount >
            range.max
        ) {
            if (range.isLab) {
                showMessage(
                    `Participants for ${selectedVenue.name} must be exactly ${selectedVenue.capacity}.`,
                    "error"
                );
            } else {
                showMessage(
                    `Participants for ${selectedVenue.name} must be between ${range.min} and ${range.max}.`,
                    "error"
                );
            }

            return;
        }

        if (
            endTime.value <=
            startTime.value
        ) {
            showMessage(
                "End time must be later than start time.",
                "error"
            );

            return;
        }

        setSubmitting(true);

        try {
            const eventData = {
                title:
                    eventName.value.trim(),

                description:
                    description.value.trim(),

                category:
                    category.value,

                eventDate:
                    date.value,

                startTime:
                    startTime.value,

                endTime:
                    endTime.value,

                venue:
                    venue.value,

                expectedParticipants:
                    participantCount
            };

            console.log(
                "Creating Event:",
                eventData
            );

            const response =
                await fetch(
                    `${CREATE_EVENT_API_BASE_URL}/events`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify(
                                eventData
                            )
                    }
                );

            const data =
                await response.json();

            console.log(
                "Create Event Response:",
                data
            );

            if (
                response.status === 401
            ) {
                localStorage.removeItem(
                    "campusVenueToken"
                );

                localStorage.removeItem(
                    "campusVenueUser"
                );

                localStorage.removeItem(
                    "campusVenueRememberMe"
                );

                showMessage(
                    "Your login session has expired. Please login again.",
                    "error"
                );

                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to create event"
                );
            }

            showMessage(
                "Event created successfully and sent for admin approval.",
                "success"
            );

            eventForm.reset();

            capacityInfo.textContent = "";

            participants.removeAttribute(
                "min"
            );

            participants.removeAttribute(
                "max"
            );

            loadOrganizer();

            setTimeout(
                function () {
                    window.location.href =
                        "my-events.html";
                },
                1200
            );

        } catch (error) {
            console.error(
                "Create Event Error:",
                error
            );

            showMessage(
                error.message ||
                "Failed to create event.",
                "error"
            );

        } finally {
            setSubmitting(
                false
            );
        }
    }
);

function showMessage(
    text,
    type
) {
    message.textContent =
        text;

    message.style.display =
        "block";

    message.className =
        `message ${type}`;

    message.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function setSubmitting(
    isSubmitting
) {
    submitButton.disabled =
        isSubmitting;

    if (isSubmitting) {
        submitButton.textContent =
            "Submitting...";
    } else {
        submitButton.textContent =
            "Submit Event";
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        setMinimumDate();
        loadOrganizer();
        loadVenues();
    }
);