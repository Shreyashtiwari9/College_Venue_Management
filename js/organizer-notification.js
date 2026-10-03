const ORGANIZER_NOTIFICATION_API =
    "/api";

let organizerNotifications = [];

let activeOrganizerNotificationFilter =
    "all";

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadOrganizerNotifications();
    }
);

function getOrganizerToken() {
    return localStorage.getItem(
        "campusVenueToken"
    );
}

async function loadOrganizerNotifications() {

    const loading =
        document.getElementById(
            "notificationLoading"
        );

    const errorBox =
        document.getElementById(
            "notificationError"
        );

    try {

        if (loading) {
            loading.style.display =
                "block";
        }

        if (errorBox) {
            errorBox.style.display =
                "none";
        }

        const token =
            getOrganizerToken();

        if (!token) {
            throw new Error(
                "Please login before viewing notifications."
            );
        }

        const response =
            await fetch(
                `${ORGANIZER_NOTIFICATION_API}/notifications`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        console.log(
            "Organizer Notifications:",
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Failed to load notifications."
            );
        }

        organizerNotifications =
            Array.isArray(
                data.notifications
            )
                ? data.notifications
                : [];

        renderOrganizerNotifications();

        updateOrganizerUnreadCount(
            data.unreadCount
        );

    } catch (error) {

        console.error(
            "Organizer Notification Error:",
            error
        );

        showOrganizerNotificationError(
            error.message ||
            "Unable to load notifications."
        );

    } finally {

        if (loading) {
            loading.style.display =
                "none";
        }
    }
}

function renderOrganizerNotifications() {

    const list =
        document.getElementById(
            "notificationList"
        );

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    const notifications =
        getFilteredOrganizerNotifications();

    if (
        notifications.length === 0
    ) {

        if (emptyState) {
            emptyState.style.display =
                "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    notifications.forEach(
        function (notification) {

            const card =
                createOrganizerNotificationCard(
                    notification
                );

            list.appendChild(card);
        }
    );
}

function filterOrganizerNotifications(
    filter,
    button
) {

    activeOrganizerNotificationFilter =
        filter || "all";

    document
        .querySelectorAll(".filter-btn")
        .forEach(
            function (btn) {

                btn.classList.remove(
                    "active"
                );
            }
        );

    if (button) {
        button.classList.add(
            "active"
        );
    }

    renderOrganizerNotifications();
}

function getFilteredOrganizerNotifications() {

    return organizerNotifications.filter(
        function (notification) {

            const type =
                String(
                    notification.type ||
                    "system"
                ).toLowerCase();

            if (
                activeOrganizerNotificationFilter ===
                "all"
            ) {
                return true;
            }

            if (
                activeOrganizerNotificationFilter ===
                "unread"
            ) {
                return !notification.isRead;
            }

            return (
                type ===
                activeOrganizerNotificationFilter
            );
        }
    );
}

function createOrganizerNotificationCard(
    notification
) {

    const card =
        document.createElement(
            "article"
        );

    const type =
        String(
            notification.type ||
            "system"
        ).toLowerCase();

    const unread =
        !notification.isRead;

    card.className =
        `notification-card ${
            unread
                ? "unread"
                : "read"
        }`;

    const icon =
        getOrganizerNotificationIcon(
            type
        );

    const iconClass =
        getOrganizerNotificationIconClass(
            type
        );

    const title =
        notification.title ||
        "Notification";

    const message =
        notification.message ||
        "";

    const time =
        formatOrganizerNotificationTime(
            notification.createdAt
        );

    const eventId =
        notification.relatedEvent
            ? (
                notification.relatedEvent._id ||
                notification.relatedEvent
            )
            : null;

    card.innerHTML = `
        <div class="notification-symbol ${iconClass}">
            ${icon}
        </div>

        <div class="notification-content">

            <div class="notification-top">

                <h3 class="notification-title">
                    ${escapeOrganizerHTML(title)}
                </h3>

                <span class="notification-time">
                    ${escapeOrganizerHTML(time)}
                </span>

            </div>

            <p class="notification-message">
                ${escapeOrganizerHTML(message)}
            </p>

            <div class="notification-actions">

                ${
                    eventId
                        ? `
                            <button
                                class="action-btn"
                                type="button"
                                onclick="openOrganizerEvent('${escapeOrganizerJS(eventId)}')">
                                View Event
                            </button>
                        `
                        : ""
                }

                ${
                    unread
                        ? `
                            <button
                                class="action-btn read-btn"
                                type="button"
                                onclick="markOrganizerNotificationRead('${escapeOrganizerJS(notification._id)}')">
                                Mark as read
                            </button>
                        `
                        : ""
                }

                <button
                    class="action-btn delete-btn"
                    type="button"
                    onclick="deleteOrganizerNotification('${escapeOrganizerJS(notification._id)}')">
                    Delete
                </button>

            </div>

        </div>
    `;

    return card;
}

function getOrganizerNotificationIcon(
    type
) {

    switch (type) {

        case "approval":
            return "✓";

        case "event":
            return "📅";

        case "venue":
            return "🏛️";

        case "registration":
            return "🎫";

        case "system":
            return "🔔";

        default:
            return "🔔";
    }
}

function getOrganizerNotificationIconClass(
    type
) {

    switch (type) {

        case "approval":
            return "success";

        case "event":
            return "event";

        case "venue":
            return "warning";

        case "registration":
            return "success";

        case "system":
            return "info";

        default:
            return "info";
    }
}

async function markOrganizerNotificationRead(
    notificationId
) {

    try {

        const token =
            getOrganizerToken();

        const response =
            await fetch(
                `${ORGANIZER_NOTIFICATION_API}/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json"
                    }
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
                "Failed to mark notification as read."
            );
        }

        const notification =
            organizerNotifications.find(
                function (item) {
                    return (
                        item._id ===
                        notificationId
                    );
                }
            );

        if (notification) {
            notification.isRead = true;
        }

        renderOrganizerNotifications();

        updateOrganizerUnreadCount();

        showOrganizerToast(
            "Notification marked as read."
        );

    } catch (error) {

        console.error(
            "Mark Organizer Notification Error:",
            error
        );

        showOrganizerToast(
            error.message ||
            "Unable to update notification."
        );
    }
}

async function markAllOrganizerNotificationsRead() {

    try {

        const token =
            getOrganizerToken();

        const response =
            await fetch(
                `${ORGANIZER_NOTIFICATION_API}/notifications/read-all`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json"
                    }
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
                "Failed to update notifications."
            );
        }

        organizerNotifications.forEach(
            function (notification) {
                notification.isRead = true;
            }
        );

        renderOrganizerNotifications();

        updateOrganizerUnreadCount();

        showOrganizerToast(
            "All notifications marked as read."
        );

    } catch (error) {

        console.error(
            "Mark All Organizer Notifications Error:",
            error
        );

        showOrganizerToast(
            error.message ||
            "Unable to update notifications."
        );
    }
}

async function deleteOrganizerNotification(
    notificationId
) {

    const confirmed =
        confirm(
            "Delete this notification?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const token =
            getOrganizerToken();

        const response =
            await fetch(
                `${ORGANIZER_NOTIFICATION_API}/notifications/${notificationId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
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
                "Failed to delete notification."
            );
        }

        organizerNotifications =
            organizerNotifications.filter(
                function (notification) {
                    return (
                        notification._id !==
                        notificationId
                    );
                }
            );

        renderOrganizerNotifications();

        updateOrganizerUnreadCount();

        showOrganizerToast(
            "Notification deleted."
        );

    } catch (error) {

        console.error(
            "Delete Organizer Notification Error:",
            error
        );

        showOrganizerToast(
            error.message ||
            "Unable to delete notification."
        );
    }
}

async function deleteAllOrganizerNotifications() {

    if (
        organizerNotifications.length === 0
    ) {
        showOrganizerToast(
            "There are no notifications to delete."
        );

        return;
    }

    const confirmed =
        confirm(
            "Delete all notifications?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const token =
            getOrganizerToken();

        const response =
            await fetch(
                `${ORGANIZER_NOTIFICATION_API}/notifications`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
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
                "Failed to delete notifications."
            );
        }

        organizerNotifications = [];

        renderOrganizerNotifications();

        updateOrganizerUnreadCount();

        showOrganizerToast(
            "All notifications deleted."
        );

    } catch (error) {

        console.error(
            "Delete All Organizer Notifications Error:",
            error
        );

        showOrganizerToast(
            error.message ||
            "Unable to delete notifications."
        );
    }
}

function updateOrganizerUnreadCount(
    serverCount = null
) {

    let count;

    if (
        typeof serverCount ===
        "number"
    ) {
        count = serverCount;
    } else {
        count =
            organizerNotifications.filter(
                function (notification) {
                    return !notification.isRead;
                }
            ).length;
    }

    const badge =
        document.getElementById(
            "notificationCount"
        );

    if (!badge) {
        return;
    }

    badge.textContent =
        count;

    badge.style.display =
        count > 0
            ? "grid"
            : "none";
}

function openOrganizerEvent(
    eventId
) {

    if (!eventId) {
        return;
    }

    window.location.href =
        `event-details.html?id=${encodeURIComponent(eventId)}`;
}

function formatOrganizerNotificationTime(
    dateValue
) {

    if (!dateValue) {
        return "Just now";
    }

    const date =
        new Date(dateValue);

    if (
        isNaN(
            date.getTime()
        )
    ) {
        return "Recently";
    }

    const now =
        new Date();

    const difference =
        now.getTime() -
        date.getTime();

    const seconds =
        Math.floor(
            difference / 1000
        );

    if (seconds < 60) {
        return "Just now";
    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {
        return `${minutes} minute${
            minutes === 1
                ? ""
                : "s"
        } ago`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    if (hours < 24) {
        return `${hours} hour${
            hours === 1
                ? ""
                : "s"
        } ago`;
    }

    const days =
        Math.floor(
            hours / 24
        );

    if (days < 7) {
        return `${days} day${
            days === 1
                ? ""
                : "s"
        } ago`;
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

function showOrganizerNotificationError(
    message
) {

    const errorBox =
        document.getElementById(
            "notificationError"
        );

    const errorMessage =
        document.getElementById(
            "notificationErrorMessage"
        );

    if (errorMessage) {
        errorMessage.textContent =
            message;
    }

    if (errorBox) {
        errorBox.style.display =
            "block";
    }
}

function showOrganizerToast(
    message
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

    toast.classList.add(
        "show"
    );

    setTimeout(
        function () {
            toast.classList.remove(
                "show"
            );
        },
        2500
    );
}

function escapeOrganizerHTML(
    value
) {

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

function escapeOrganizerJS(
    value
) {

    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );
}

window.loadOrganizerNotifications =
    loadOrganizerNotifications;

window.filterOrganizerNotifications =
    filterOrganizerNotifications;

window.markOrganizerNotificationRead =
    markOrganizerNotificationRead;

window.markAllOrganizerNotificationsRead =
    markAllOrganizerNotificationsRead;

window.deleteOrganizerNotification =
    deleteOrganizerNotification;

window.deleteAllOrganizerNotifications =
    deleteAllOrganizerNotifications;

window.openOrganizerEvent =
    openOrganizerEvent;