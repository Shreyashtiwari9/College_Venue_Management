const VENUE_API_URL = "/api";

let allVenues = [];




document.addEventListener("DOMContentLoaded", function () {

    console.log("Admin Venues JS Loaded");

    loadVenues();

    const searchInput = document.getElementById("search");
    const filter = document.getElementById("filter");
    const venueForm = document.getElementById("venueForm");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyFilters
        );
    }

    if (filter) {
        filter.addEventListener(
            "change",
            applyFilters
        );
    }

    if (venueForm) {
        venueForm.addEventListener(
            "submit",
            saveVenue
        );
    }

});




async function loadVenues() {

    const loading = document.getElementById("venueLoading");
    const errorBox = document.getElementById("venueError");

    if (loading) {
        loading.style.display = "block";
    }

    if (errorBox) {
        errorBox.style.display = "none";
        errorBox.textContent = "";
    }

    try {

        console.log(
            "Fetching venues:",
            `${VENUE_API_URL}/venues`
        );

        const response = await fetch(
            `${VENUE_API_URL}/venues`
        );

        console.log(
            "Venue Response Status:",
            response.status
        );

        const data = await response.json();

        console.log(
            "Venue API Response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );

        }

        allVenues =
            Array.isArray(data.venues)
                ? data.venues
                : [];

        console.log(
            "Venues Found:",
            allVenues.length
        );

        if (loading) {
            loading.style.display = "none";
        }

        renderVenues(allVenues);

    } catch (error) {

        console.error(
            "VENUE LOAD ERROR:",
            error
        );

        if (loading) {
            loading.style.display = "none";
        }

        if (errorBox) {

            errorBox.textContent =
                "Unable to load venues: " +
                error.message;

            errorBox.style.display = "block";

        }

    }

}




function renderVenues(venues) {

    const venueGrid =
        document.getElementById("venueGrid");

    const noVenues =
        document.getElementById("noVenues");

    if (!venueGrid) {

        console.error(
            "venueGrid element not found."
        );

        return;

    }

    venueGrid.innerHTML = "";

    if (
        !Array.isArray(venues) ||
        venues.length === 0
    ) {

        if (noVenues) {
            noVenues.style.display = "block";
        }

        return;

    }

    if (noVenues) {
        noVenues.style.display = "none";
    }


    venues.forEach(function (venue) {

        const card =
            document.createElement("div");

        card.className =
            "box venue";

        const name =
            venue.name ||
            "Unnamed Venue";

        const location =
            venue.location ||
            "Location not available";

        const capacity =
            venue.capacity || 0;

        const status =
            normalizeStatus(
                venue.status
            );

        const description =
            venue.description ||
            "No description available.";

        const facilities =
            Array.isArray(venue.facilities)
                ? venue.facilities
                : [];


        let facilitiesHTML =
            "No facilities listed.";

        if (facilities.length > 0) {

            facilitiesHTML =
                facilities
                    .map(function (facility) {

                        return `
                            <span class="facility-tag">
                                ${escapeHTML(facility)}
                            </span>
                        `;

                    })
                    .join("");

        }


        const icon =
            getVenueIcon(name);


        card.innerHTML = `

            <div class="venue-icon">
                ${icon}
            </div>

            <h2>
                ${escapeHTML(name)}
            </h2>

            <p>
                <strong>Capacity:</strong>
                ${capacity}
            </p>

            <p>
                <strong>Location:</strong>
                ${escapeHTML(location)}
            </p>

            <span class="status ${getStatusClass(status)}">
                ${capitalize(status)}
            </span>

            <p class="venue-description">
                ${escapeHTML(description)}
            </p>

            <div class="venue-facilities">
                ${facilitiesHTML}
            </div>

            <div class="venue-actions">

                <button
                    type="button"
                    class="btn btn-outline"
                    onclick="editVenue('${venue._id}')"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="btn btn-danger"
                    onclick="deleteVenue('${venue._id}')"
                >
                    Delete
                </button>

            </div>

        `;

        venueGrid.appendChild(card);

    });

}




function applyFilters() {

    const searchInput =
        document.getElementById("search");

    const filter =
        document.getElementById("filter");


    const searchValue =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const statusValue =
        filter
            ? filter.value
            : "";


    const filteredVenues =
        allVenues.filter(function (venue) {

            const name =
                (venue.name || "")
                    .toLowerCase();

            const location =
                (venue.location || "")
                    .toLowerCase();

            const description =
                (venue.description || "")
                    .toLowerCase();


            const matchesSearch =
                !searchValue ||
                name.includes(searchValue) ||
                location.includes(searchValue) ||
                description.includes(searchValue);


            const venueStatus =
                normalizeStatus(
                    venue.status
                );


            const matchesStatus =
                !statusValue ||
                venueStatus === statusValue;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderVenues(
        filteredVenues
    );

}




window.addVenue = function () {

    const modal =
        document.getElementById("venueModal");

    const modalTitle =
        document.getElementById("modalTitle");

    const form =
        document.getElementById("venueForm");


    if (!modal || !form) {
        return;
    }


    form.reset();


    document.getElementById(
        "venueId"
    ).value = "";


    modalTitle.textContent =
        "Add Venue";


    document.getElementById(
        "saveVenueButton"
    ).textContent =
        "Save Venue";


    modal.classList.add(
        "active"
    );

};




window.editVenue = function (
    venueId
) {

    const venue =
        allVenues.find(
            function (item) {

                return (
                    String(item._id) ===
                    String(venueId)
                );

            }
        );


    if (!venue) {

        alert(
            "Venue information not found."
        );

        return;

    }


    document.getElementById(
        "venueId"
    ).value =
        venue._id || "";


    document.getElementById(
        "venueName"
    ).value =
        venue.name || "";


    document.getElementById(
        "venueLocation"
    ).value =
        venue.location || "";


    document.getElementById(
        "venueCapacity"
    ).value =
        venue.capacity || "";


    document.getElementById(
        "venueStatus"
    ).value =
        normalizeStatus(
            venue.status
        );


    document.getElementById(
        "venueDescription"
    ).value =
        venue.description || "";


    document.getElementById(
        "venueFacilities"
    ).value =
        Array.isArray(
            venue.facilities
        )
            ? venue.facilities.join(", ")
            : "";


    document.getElementById(
        "venueImage"
    ).value =
        venue.image || "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Venue";


    document.getElementById(
        "saveVenueButton"
    ).textContent =
        "Update Venue";


    document.getElementById(
        "venueModal"
    ).classList.add(
        "active"
    );

};




async function saveVenue(event) {

    event.preventDefault();


    const venueId =
        document.getElementById(
            "venueId"
        ).value.trim();


    const name =
        document.getElementById(
            "venueName"
        ).value.trim();


    const location =
        document.getElementById(
            "venueLocation"
        ).value.trim();


    const capacity =
        Number(
            document.getElementById(
                "venueCapacity"
            ).value
        );


    const status =
        document.getElementById(
            "venueStatus"
        ).value;


    const description =
        document.getElementById(
            "venueDescription"
        ).value.trim();


    const facilitiesText =
        document.getElementById(
            "venueFacilities"
        ).value.trim();


    const image =
        document.getElementById(
            "venueImage"
        ).value.trim();


    if (!name) {

        alert(
            "Please enter venue name."
        );

        return;

    }


    if (!location) {

        alert(
            "Please enter venue location."
        );

        return;

    }


    if (
        !capacity ||
        capacity < 1
    ) {

        alert(
            "Please enter a valid capacity."
        );

        return;

    }


    const facilities =
        facilitiesText
            ? facilitiesText
                .split(",")
                .map(
                    function (item) {
                        return item.trim();
                    }
                )
                .filter(Boolean)
            : [];


    const venueData = {

        name: name,

        location: location,

        capacity: capacity,

        description: description,

        facilities: facilities,

        status: status,

        image: image

    };


    const saveButton =
        document.getElementById(
            "saveVenueButton"
        );


    const originalText =
        saveButton
            ? saveButton.textContent
            : "Save Venue";


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            venueId
                ? "Updating..."
                : "Saving...";

    }


    try {

        let response;


        if (venueId) {



            response =
                await fetch(
                    `${VENUE_API_URL}/venues/${venueId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${localStorage.getItem("campusVenueToken")}`
                        },

                        body:
                            JSON.stringify(
                                venueData
                            )
                    }
                );

        } else {



            response =
                await fetch(
                    `${VENUE_API_URL}/venues`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${localStorage.getItem("campusVenueToken")}`
                        },

                        body:
                            JSON.stringify(
                                venueData
                            )
                    }
                );

        }


        const data =
            await response.json();


        console.log(
            "Save Venue Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );

        }


        alert(
            venueId
                ? "Venue updated successfully."
                : "Venue added successfully."
        );


        closeVenueModal();


        await loadVenues();


    } catch (error) {

        console.error(
            "SAVE VENUE ERROR:",
            error
        );


        alert(
            "Unable to save venue: " +
            error.message
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                originalText;

        }

    }

}




window.deleteVenue = async function (
    venueId
) {

    const venue =
        allVenues.find(
            function (item) {

                return (
                    String(item._id) ===
                    String(venueId)
                );

            }
        );


    if (!venue) {

        alert(
            "Venue not found."
        );

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${venue.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${VENUE_API_URL}/venues/${venueId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("campusVenueToken")}`
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "Delete Venue Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );

        }


        alert(
            "Venue deleted successfully."
        );


        await loadVenues();


    } catch (error) {

        console.error(
            "DELETE VENUE ERROR:",
            error
        );


        alert(
            "Unable to delete venue: " +
            error.message
        );

    }

};




window.closeVenueModal = function () {

    const modal =
        document.getElementById(
            "venueModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

};




document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "venueModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeVenueModal();

        }

    }
);




document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeVenueModal();

        }

    }
);




function normalizeStatus(status) {

    if (!status) {
        return "available";
    }


    return String(status)
        .toLowerCase()
        .trim();

}


function getStatusClass(status) {

    switch (
        normalizeStatus(status)
    ) {

        case "occupied":
            return "occupied";

        case "maintenance":
            return "maintenance";

        case "available":
        default:
            return "available";

    }

}


function capitalize(value) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}




function getVenueIcon(name) {

    const venueName =
        String(name || "")
            .toLowerCase();


    if (
        venueName.includes("lab") ||
        venueName.includes("computer") ||
        venueName.includes("innovation")
    ) {

        return "💻";

    }


    if (
        venueName.includes("auditorium") ||
        venueName.includes("amphitheatre")
    ) {

        return "🏛️";

    }


    if (
        venueName.includes("conference")
    ) {

        return "🤝";

    }


    if (
        venueName.includes("ground") ||
        venueName.includes("sports")
    ) {

        return "🏟️";

    }


    if (
        venueName.includes("seminar")
    ) {

        return "🎤";

    }


    if (
        venueName.includes("classroom")
    ) {

        return "🖥️";

    }


    return "🏢";

}




function escapeHTML(value) {

    return String(value ?? "")
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