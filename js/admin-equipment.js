const ADMIN_EQUIPMENT_API_URL = "/api";

let equipmentRequests = [];

async function loadEquipmentRequests() {

    const table = document.getElementById("equipmentTable");
    const token = localStorage.getItem("campusVenueToken");

    if (!table || !token) {
        return;
    }

    table.innerHTML = `
        <tr><td colspan="6">Loading equipment requests...</td></tr>
    `;

    try {
        const response = await fetch(
            `${ADMIN_EQUIPMENT_API_URL}/equipment-requests`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load equipment requests.");
        }

        equipmentRequests = Array.isArray(data.requests)
            ? data.requests
            : [];

        renderEquipmentRequests();

    } catch (error) {
        console.error("Equipment Requests Error:", error);
        table.innerHTML = `
            <tr><td colspan="6">${escapeHTML(error.message)}</td></tr>
        `;
    }
}

function renderEquipmentRequests() {

    const table = document.getElementById("equipmentTable");
    const search = document.getElementById("search").value.toLowerCase().trim();
    const status = document.getElementById("status").value.toLowerCase();

    const filtered = equipmentRequests.filter(function (request) {
        const text = `${request.event} ${request.equipment} ${request.notes || ""}`.toLowerCase();
        return text.includes(search) && (!status || String(request.status).toLowerCase() === status);
    });

    if (filtered.length === 0) {
        table.innerHTML = `<tr><td colspan="6">No equipment requests found.</td></tr>`;
        return;
    }

    table.innerHTML = filtered.map(function (request) {
        const requestStatus = request.status || "Pending";
        const organizer = request.organizer?.name || request.organizer?.email || "Organizer";
        const actions = requestStatus === "Pending"
            ? `<button class="manage-btn" onclick="updateEquipmentStatus('${request._id}', 'Approved')">Approve</button>
               <button class="manage-btn reject" onclick="updateEquipmentStatus('${request._id}', 'Rejected')">Reject</button>`
            : requestStatus === "Approved"
                ? `<button class="manage-btn" onclick="updateEquipmentStatus('${request._id}', 'Returned')">Mark Returned</button>`
                : "-";

        return `
            <tr>
                <td>${escapeHTML(request.equipment)}</td>
                <td>${escapeHTML(String(request.quantity))}</td>
                <td>${escapeHTML(request.event)}</td>
                <td>${escapeHTML(organizer)}</td>
                <td><span class="status ${requestStatus.toLowerCase()}">${escapeHTML(requestStatus)}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    }).join("");
}

async function updateEquipmentStatus(requestId, status) {

    const token = localStorage.getItem("campusVenueToken");

    try {
        const response = await fetch(
            `${ADMIN_EQUIPMENT_API_URL}/equipment-requests/${requestId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update request.");
        }

        await loadEquipmentRequests();

    } catch (error) {
        alert(error.message);
    }
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}





function filterEquipment() {
    renderEquipmentRequests();
}




function addEquipment() {
    loadEquipmentRequests();
}




function manage(name) {
    return name;
}




function logout() {
    window.logoutUser();
}




document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("search");
    const statusInput = document.getElementById("status");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterEquipment
        );
    }

    if (statusInput) {
        statusInput.addEventListener(
            "change",
            filterEquipment
        );
    }

    loadEquipmentRequests();

});