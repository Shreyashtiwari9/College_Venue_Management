const ADMIN_USERS_API_URL = "/api/admin/users";
const CREATE_ORGANIZER_API_URL = "/api/auth/create-organizer";

let adminUsers = [];

async function loadUsers() {
    const table = document.getElementById("userTable");

    if (!table) {
        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="7">Loading users...</td>
        </tr>
    `;

    try {
        const response = await fetch(
            ADMIN_USERS_API_URL,
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                }
            }
        );
        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
            throw new Error("You are not authorized to view users.");
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load users.");
        }

        adminUsers = Array.isArray(data.users) ? data.users : [];
        renderUsers();
    } catch (error) {
        console.error("Admin Users Error:", error);
        table.innerHTML = `
            <tr>
                <td colspan="7">${escapeUserText(error.message)}</td>
            </tr>
        `;
    }
}

function renderUsers() {
    const table = document.getElementById("userTable");

    if (!table) {
        return;
    }

    table.innerHTML = adminUsers.length
        ? adminUsers.map(function (user) {
            const active = user.isActive !== false;
            const role = user.role || "student";
            const approvalStatus = user.organizerApprovalStatus || "";
            const statusText = approvalStatus === "pending"
                ? "Pending approval"
                : approvalStatus === "rejected"
                    ? "Rejected"
                    : active
                        ? "Active"
                        : "Blocked";
            const isPendingOrganizer = role === "organizer" && approvalStatus === "pending";
            const organizerDetails = role === "organizer"
                ? `
                    <details class="organizer-row-details">
                        <summary>View profile</summary>
                        <dl>
                            ${organizerDetail("Designation", user.designation)}
                            ${organizerDetail("Organizer type", organizerTypeLabel(user.organizerType))}
                            ${organizerDetail("Club / Society", user.clubName)}
                            ${organizerDetail("Faculty coordinator", user.facultyCoordinatorName)}
                            ${organizerDetail("Responsibilities", user.responsibilityDescription)}
                            ${organizerDetail("Access reason", user.accessRequestReason)}
                            ${organizerDetail("Request date", user.createdAt ? new Date(user.createdAt).toLocaleString() : "--")}
                            ${organizerDetail("Approval status", approvalStatus || (active ? "approved" : "not approved"))}
                        </dl>
                    </details>
                `
                : "--";

            return `
                <tr>
                    <td>${escapeUserText(user.name || "Unknown")}</td>
                    <td>${escapeUserText(user.collegeId || "--")}</td>
                    <td>${escapeUserText(user.email || "--")}</td>
                    <td><span class="badge ${escapeUserText(role)}">${escapeUserText(role)}</span></td>
                    <td class="organizer-profile-cell">${organizerDetails}</td>
                    <td class="status-cell">${escapeUserText(statusText)}</td>
                    <td>
                        <button
                            class="action edit"
                            type="button"
                            onclick="editUser('${user._id}')"
                        >
                            Edit
                        </button>
                        ${isPendingOrganizer
                            ? `
                                <button class="action approve" type="button" onclick="reviewOrganizerRequest(this, '${user._id}', 'approve')">Approve</button>
                                <button class="action reject" type="button" onclick="reviewOrganizerRequest(this, '${user._id}', 'reject')">Reject</button>
                            `
                            : approvalStatus === "rejected"
                                ? ""
                                : `
                                    <button class="action edit" type="button" onclick="toggleStatus(this, '${user._id}', ${active})">
                                        ${active ? "Block" : "Unblock"}
                                    </button>
                                `}
                        <button
                            class="action edit"
                            type="button"
                            onclick="deleteUser('${user._id}')"
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="7">No users found.</td>
            </tr>
        `;

    filterUsers();
}

async function reviewOrganizerRequest(button, userId, decision) {
    const user = adminUsers.find(item => String(item._id) === String(userId));

    if (!user || user.organizerApprovalStatus !== "pending") {
        return;
    }

    const actionLabel = decision === "approve" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.name}'s organizer request?`)) {
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(
            `${ADMIN_USERS_API_URL}/${encodeURIComponent(userId)}/organizer-review`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("campusVenueToken")}`
                },
                body: JSON.stringify({ decision })
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || `Unable to ${actionLabel} request.`);
        }

        await loadUsers();
    } catch (error) {
        console.error("Organizer Review Error:", error);
        window.alert(error.message);
        button.disabled = false;
    }
}

function organizerTypeLabel(value) {
    const labels = {
        "faculty-coordinator": "Faculty Coordinator",
        "staff-coordinator": "Staff Coordinator",
        "club-coordinator": "Club Coordinator",
        "student-club-representative": "Student Club Representative"
    };

    return labels[value] || "--";
}

function organizerDetail(label, value) {
    return `
        <div>
            <dt>${escapeUserText(label)}</dt>
            <dd>${escapeUserText(value || "--")}</dd>
        </div>
    `;
}

function escapeUserText(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function editUser(userId) {
    const user = adminUsers.find(item => String(item._id) === String(userId));

    if (!user) {
        return;
    }

    const updates = {};
    const fields = ["name", "email", "collegeId", "department", "phone"];

    if (user.role === "organizer") {
        fields.push(
            "designation",
            "organizerType",
            "clubName",
            "facultyCoordinatorName",
            "responsibilityDescription",
            "accessRequestReason"
        );
    } else {
        fields.push("year");
    }

    for (const field of fields) {
        const value = window.prompt(`Update ${field}:`, user[field] || "");

        if (value === null) {
            return;
        }

        updates[field] = value.trim();
    }

    try {
        const response = await fetch(
            `${ADMIN_USERS_API_URL}/${encodeURIComponent(userId)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                },
                body: JSON.stringify(updates)
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update user.");
        }

        await loadUsers();
    } catch (error) {
        console.error("Admin User Update Error:", error);
        window.alert(error.message);
    }
}

async function deleteUser(userId) {
    const user = adminUsers.find(item => String(item._id) === String(userId));

    if (!user || !window.confirm(`Delete ${user.name || "this user"}?`)) {
        return;
    }

    try {
        const response = await fetch(
            `${ADMIN_USERS_API_URL}/${encodeURIComponent(userId)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                }
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to delete user.");
        }

        await loadUsers();
    } catch (error) {
        console.error("Admin User Delete Error:", error);
        window.alert(error.message);
    }
}

function filterUsers() {

    const searchInput = document.getElementById("search");
    const roleSelect = document.getElementById("role");
    const statusSelect = document.getElementById("status");

    const search = searchInput.value.toLowerCase().trim();
    const role = roleSelect.value.toLowerCase();
    const status = statusSelect.value.toLowerCase();

    const rows = document.querySelectorAll("#userTable tr");

    let visibleUsers = 0;


    rows.forEach(function (row) {

        const text = row.innerText.toLowerCase();

        
        const matchesSearch =
            text.includes(search);


        
        const matchesRole =
            !role || text.includes(role);


        
        const matchesStatus =
            !status || text.includes(status);


        

        if (
            matchesSearch &&
            matchesRole &&
            matchesStatus
        ) {

            row.style.display = "";

            visibleUsers++;

        } else {

            row.style.display = "none";

        }

    });


    

    const noUsers =
        document.getElementById("noUsers");


    if (visibleUsers === 0) {

        noUsers.style.display = "block";

    } else {

        noUsers.style.display = "none";

    }

}




async function toggleStatus(button, userId, currentStatus) {

    const row = button.closest("tr");

    if (!row) {
        return;
    }


    

    const statusCell =
        row.querySelector(".status-cell");


    

    const nextStatus = !currentStatus;
    const confirmed = window.confirm(
        nextStatus
            ? "Activate this user?"
            : "Deactivate this user?"
    );

    if (!confirmed) {
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(
            `${ADMIN_USERS_API_URL}/${encodeURIComponent(userId)}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        `Bearer ${localStorage.getItem("campusVenueToken")}`
                },
                body: JSON.stringify({ isActive: nextStatus })
            }
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update user status.");
        }

        await loadUsers();
    } catch (error) {
        console.error("User Status Error:", error);
        window.alert(error.message);
        button.disabled = false;
    }

}




function logout() {

    localStorage.removeItem("campusVenueUser");

    window.location.href = "../login.html";

}

function showOrganizerCreateMessage(message, type = "error") {
    const messageElement = document.getElementById("organizerCreateMessage");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className = `organizer-create-message visible ${type}`;
}

function setupOrganizerCreation() {
    const form = document.getElementById("organizerCreateForm");
    const toggleButton = document.getElementById("toggleOrganizerCreate");
    const closeButton = document.getElementById("closeOrganizerCreate");
    const organizerType = document.getElementById("organizerType");
    const clubFields = document.getElementById("organizerClubFields");
    const clubName = document.getElementById("organizerClubName");
    const facultyFields = document.getElementById("organizerFacultyFields");
    const facultyName = document.getElementById("organizerFacultyCoordinator");
    const password = document.getElementById("organizerPassword");
    const confirmPassword = document.getElementById("organizerConfirmPassword");
    const phone = document.getElementById("organizerPhone");

    if (!form || !toggleButton || !organizerType) {
        return;
    }

    function updateConditionalFields() {
        const selectedType = organizerType.value;
        const needsClub = [
            "club-coordinator",
            "student-club-representative"
        ].includes(selectedType);
        const needsFaculty = selectedType === "student-club-representative";

        clubFields.hidden = !needsClub;
        clubName.disabled = !needsClub;
        clubName.required = needsClub;

        facultyFields.hidden = !needsFaculty;
        facultyName.disabled = !needsFaculty;
        facultyName.required = needsFaculty;
    }

    function validatePasswords() {
        confirmPassword.setCustomValidity(
            confirmPassword.value && confirmPassword.value !== password.value
                ? "Passwords do not match."
                : ""
        );
    }

    function validatePhone() {
        const digits = phone.value.replace(/\D/g, "");
        const valid =
            /^\+?[\d\s().-]+$/.test(phone.value.trim()) &&
            digits.length >= 7 &&
            digits.length <= 15;

        phone.setCustomValidity(
            valid ? "" : "Please enter a valid contact number."
        );
    }

    toggleButton.addEventListener("click", function () {
        form.hidden = !form.hidden;
        toggleButton.setAttribute("aria-expanded", String(!form.hidden));
        if (!form.hidden) {
            document.getElementById("organizerName")?.focus();
        }
    });

    closeButton?.addEventListener("click", function () {
        form.hidden = true;
        toggleButton.setAttribute("aria-expanded", "false");
    });

    organizerType.addEventListener("change", updateConditionalFields);
    phone.addEventListener("input", validatePhone);
    password.addEventListener("input", validatePasswords);
    confirmPassword.addEventListener("input", validatePasswords);

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        validatePhone();
        validatePasswords();

        if (!form.reportValidity()) {
            return;
        }

        const payload = {
            name: document.getElementById("organizerName").value.trim(),
            email: document.getElementById("organizerEmail").value.trim(),
            phone: document.getElementById("organizerPhone").value.trim(),
            collegeId: document.getElementById("organizerCollegeId").value.trim(),
            department: document.getElementById("organizerDepartment").value.trim(),
            designation: document.getElementById("organizerDesignation").value.trim(),
            organizerType: organizerType.value,
            clubName: clubName.value.trim(),
            facultyCoordinatorName: facultyName.value.trim(),
            responsibilityDescription: document.getElementById("organizerResponsibilities").value.trim(),
            accessRequestReason: document.getElementById("organizerReason").value.trim(),
            termsAccepted: document.getElementById("organizerTermsAccepted").checked,
            password: password.value
        };

        const submitButton = document.getElementById("organizerCreateSubmit");
        const originalButtonContent = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = "Creating account...";

        try {
            const response = await fetch(CREATE_ORGANIZER_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("campusVenueToken")}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to create organizer account.");
            }

            form.reset();
            updateConditionalFields();
            showOrganizerCreateMessage("Organizer account created and activated.", "success");
            await loadUsers();
        } catch (error) {
            showOrganizerCreateMessage(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
        }
    });

    updateConditionalFields();
}




document.addEventListener("DOMContentLoaded", function () {
    setupOrganizerCreation();

    loadUsers();

    const search =
        document.getElementById("search");

    const role =
        document.getElementById("role");

    const status =
        document.getElementById("status");


    

    search.addEventListener(
        "input",
        filterUsers
    );


    

    role.addEventListener(
        "change",
        filterUsers
    );


    

    status.addEventListener(
        "change",
        filterUsers
    );

});

