"use strict";

const VOLUNTEER_API_URL = "/api/volunteers";

let allVolunteers = [];

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadVolunteers();
    }
);


function getOrganizerId() {

    const user =
        getCurrentUser();

    if (!user) {
        return null;
    }

    return (
        user._id ||
        user.id ||
        null
    );
}


async function loadVolunteers() {

    const grid =
        document.getElementById(
            "volunteers"
        );

    if (!grid) {
        return;
    }


    const organizerId =
        getOrganizerId();


    if (!organizerId) {

        grid.innerHTML = `
            <div class="volunteer-empty-card">

                <div class="volunteer-empty-icon">
                    <i class="bi bi-person-lock"></i>
                </div>

                <h2>Organizer Session Required</h2>

                <p>
                    Your organizer session could not be found.
                    Please login again to manage volunteers.
                </p>

                <button
                    class="volunteer-login-btn"
                    type="button"
                    onclick="goToLogin()"
                >
                    <i class="bi bi-box-arrow-in-right"></i>
                    Login as Organizer
                </button>

            </div>
        `;

        return;
    }


    grid.innerHTML = `
        <div class="volunteer-loading-card">

            <div class="volunteer-loader"></div>

            <p>
                Loading volunteers...
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                VOLUNTEER_API_URL,
                {
                    headers: getVolunteerHeaders(false)
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load volunteers."
            );

        }


        allVolunteers =
            Array.isArray(
                data.volunteers
            )
                ? data.volunteers
                : [];


        renderVolunteers(
            allVolunteers
        );


    } catch (error) {

        console.error(
            "Load Volunteers Error:",
            error
        );


        grid.innerHTML = `
            <div class="volunteer-empty-card">

                <div class="volunteer-empty-icon error">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>

                <h2>
                    Unable to Load Volunteers
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    class="volunteer-login-btn"
                    type="button"
                    onclick="loadVolunteers()"
                >
                    <i class="bi bi-arrow-clockwise"></i>
                    Try Again
                </button>

            </div>
        `;
    }
}


function renderVolunteers(
    volunteers
) {

    const grid =
        document.getElementById(
            "volunteers"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    if (!volunteers.length) {

        grid.innerHTML = `
            <div class="volunteer-empty-card">

                <div class="volunteer-empty-icon">
                    <i class="bi bi-people"></i>
                </div>

                <h2>
                    No Volunteers Found
                </h2>

                <p>
                    Add your first volunteer to manage
                    event responsibilities.
                </p>

                <button
                    class="volunteer-login-btn"
                    type="button"
                    onclick="addVolunteer()"
                >
                    <i class="bi bi-person-plus"></i>
                    Add First Volunteer
                </button>

            </div>
        `;

        return;
    }


    volunteers.forEach(
        function (volunteer) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card volunteer";


            card.dataset.id =
                volunteer._id;


            const initials =
                getInitials(
                    volunteer.name
                );


            const status =
                volunteer.status === "assigned"
                    ? "assigned"
                    : "active";


            const buttonText =
                status === "assigned"
                    ? "Reassign"
                    : "Assign";


            card.innerHTML = `
                <div class="avatar">
                    ${escapeHTML(
                        initials
                    )}
                </div>

                <h2>
                    ${escapeHTML(
                        volunteer.name
                    )}
                </h2>

                <p>
                    ${escapeHTML(
                        volunteer.role
                    )}
                </p>

                <span class="badge ${status}">
                    ${
                        status === "assigned"
                            ? "Assigned"
                            : "Active"
                    }
                </span>

                <div class="actions">

                    <button
                        class="btn btn-outline"
                        type="button"
                        onclick="assignVolunteer('${volunteer._id}')"
                    >
                        ${buttonText}
                    </button>

                    <button
                        class="btn btn-outline"
                        type="button"
                        onclick="removeVolunteer('${volunteer._id}')"
                    >
                        Remove
                    </button>

                </div>
            `;


            grid.appendChild(
                card
            );
        }
    );
}


function filterVolunteers() {

    const searchInput =
        document.getElementById(
            "search"
        );


    const roleInput =
        document.getElementById(
            "role"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const role =
        roleInput
            ? roleInput.value
                .toLowerCase()
                .trim()
            : "";


    const filtered =
        allVolunteers.filter(
            function (volunteer) {

                const name =
                    String(
                        volunteer.name || ""
                    ).toLowerCase();


                const volunteerRole =
                    String(
                        volunteer.role || ""
                    ).toLowerCase();


                const searchMatch =
                    !search ||
                    name.includes(search) ||
                    volunteerRole.includes(search);


                const roleMatch =
                    !role ||
                    volunteerRole.includes(role);


                return (
                    searchMatch &&
                    roleMatch
                );
            }
        );


    renderVolunteers(
        filtered
    );
}


async function assignVolunteer(
    volunteerId
) {

    if (!volunteerId) {
        return;
    }


    try {

        const response =
            await fetch(
                `${VOLUNTEER_API_URL}/${encodeURIComponent(
                    volunteerId
                )}`,
                {
                    method: "PUT",

                    headers: getVolunteerHeaders(true),

                    body: JSON.stringify({
                        status: "assigned"
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to assign volunteer."
            );
        }


        await loadVolunteers();


    } catch (error) {

        console.error(
            "Assign Volunteer Error:",
            error
        );


        alert(
            error.message ||
            "Unable to assign volunteer."
        );
    }
}


async function removeVolunteer(
    volunteerId
) {

    if (!volunteerId) {
        return;
    }


    const confirmed =
        confirm(
            "Remove this volunteer?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${VOLUNTEER_API_URL}/${encodeURIComponent(
                    volunteerId
                )}`,
                {
                    method: "DELETE",
                    headers: getVolunteerHeaders(false)
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to remove volunteer."
            );
        }


        await loadVolunteers();


    } catch (error) {

        console.error(
            "Remove Volunteer Error:",
            error
        );


        alert(
            error.message ||
            "Unable to remove volunteer."
        );
    }
}


async function addVolunteer() {

    const name =
        prompt(
            "Enter volunteer name:"
        );


    if (
        !name ||
        !name.trim()
    ) {
        return;
    }


    const role =
        prompt(
            "Enter volunteer role:",
            "Registration"
        );


    if (
        !role ||
        !role.trim()
    ) {
        return;
    }


    const organizerId =
        getOrganizerId();


    if (!organizerId) {

        alert(
            "Organizer session not found."
        );

        return;
    }


    try {

        const response =
            await fetch(
                VOLUNTEER_API_URL,
                {
                    method: "POST",

                    headers: getVolunteerHeaders(true),

                    body: JSON.stringify({

                        name:
                            name.trim(),

                        role:
                            role.trim()

                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to add volunteer."
            );
        }


        await loadVolunteers();


    } catch (error) {

        console.error(
            "Add Volunteer Error:",
            error
        );


        alert(
            error.message ||
            "Unable to add volunteer."
        );
    }
}


function goToLogin() {

    window.location.href =
        "../login.html";
}


function getInitials(name) {

    return String(
        name || ""
    )
        .trim()
        .split(/\s+/)
        .map(
            function (word) {
                return word.charAt(0);
            }
        )
        .join("")
        .substring(0, 2)
        .toUpperCase();
}


function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function getVolunteerHeaders(includeJson) {
    const headers = {
        Authorization:
            `Bearer ${localStorage.getItem("campusVenueToken")}`
    };

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}