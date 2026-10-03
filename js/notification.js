


const NOTIFICATION_API_URL =
    "/api";

let allNotifications = [];

let activeNotificationFilter = "all";




document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadNotifications();

    }
);




function getNotificationToken() {

    return localStorage.getItem(
        "campusVenueToken"
    );

}




async function loadNotifications() {

    const loading =
        document.getElementById(
            "notificationLoading"
        );

    const errorBox =
        document.getElementById(
            "notificationError"
        );

    const list =
        document.getElementById(
            "notificationList"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (errorBox) {

        errorBox.style.display =
            "none";

    }


    try {

        const token =
            getNotificationToken();


        if (!token) {

            throw new Error(
                "Please login before viewing notifications."
            );

        }


        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/notifications`,
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

        if (response.status === 401) {
            localStorage.removeItem("campusVenueToken");
            localStorage.removeItem("campusVenueUser");
            localStorage.removeItem("campusVenueRole");
            window.location.href = "../login.html";
            return;
        }


        console.log(
            "Notifications Response:",
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


        allNotifications =
            Array.isArray(
                data.notifications
            )
                ? data.notifications
                : [];


        renderNotifications();


        updateUnreadCount(
            data.unreadCount
        );


    } catch (error) {

        console.error(
            "Notification Load Error:",
            error
        );


        showNotificationError(
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




function renderNotifications() {

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


    const filteredNotifications =
        getFilteredNotifications();


    if (
        filteredNotifications.length === 0
    ) {

        list.innerHTML = "";


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


    filteredNotifications.forEach(
        function (notification) {

            const card =
                createNotificationCard(
                    notification
                );

            list.appendChild(card);

        }
    );

}




function filterNotifications(
    filter,
    button
) {

    activeNotificationFilter =
        filter || "all";


    const buttons =
        document.querySelectorAll(
            ".filter-btn"
        );


    buttons.forEach(
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

    } else {

        const activeButton =
            document.querySelector(
                `.filter-btn[data-filter="${activeNotificationFilter}"]`
            );

        if (activeButton) {

            activeButton.classList.add(
                "active"
            );

        }

    }


    renderNotifications();

}




function getFilteredNotifications() {

    return allNotifications.filter(
        function (notification) {

            const type =
                String(
                    notification.type ||
                    "system"
                ).toLowerCase();


            const isUnread =
                !notification.isRead;


            if (
                activeNotificationFilter ===
                "all"
            ) {

                return true;

            }


            if (
                activeNotificationFilter ===
                "unread"
            ) {

                return isUnread;

            }


            return (
                type ===
                activeNotificationFilter
            );

        }
    );

}




function createNotificationCard(
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


    const isUnread =
        !notification.isRead;


    card.className =
        `notification-card ${
            isUnread
                ? "unread"
                : "read"
        }`;


    card.dataset.type =
        type;


    card.dataset.id =
        notification._id;


    const icon =
        getNotificationIcon(
            type
        );


    const iconClass =
        getNotificationIconClass(
            type
        );


    const time =
        formatNotificationTime(
            notification.createdAt
        );


    const title =
        notification.title ||
        "Notification";


    const message =
        notification.message ||
        "";


    const eventId =
        notification.relatedEvent
            ? (
                notification.relatedEvent._id ||
                notification.relatedEvent
            )
            : null;


    card.innerHTML = `

        <div
            class="notification-symbol ${iconClass}"
        >
            ${icon}
        </div>


        <div class="notification-content">


            <div class="notification-top">

                <h3 class="notification-title">
                    ${escapeHTML(title)}
                </h3>


                <span class="notification-time">
                    ${escapeHTML(time)}
                </span>

            </div>


            <p class="notification-message">
                ${escapeHTML(message)}
            </p>


            <div class="notification-actions">


                ${
                    eventId
                        ? `
                            <button
                                class="action-btn"
                                type="button"
                                onclick="openEvent('${eventId}')"
                            >
                                View Event
                            </button>
                          `
                        : ""
                }


                ${
                    isUnread
                        ? `
                            <button
                                class="action-btn read-btn"
                                type="button"
                                onclick="markRead('${notification._id}')"
                            >
                                Mark as read
                            </button>
                          `
                        : ""
                }


                <button
                    class="action-btn delete-btn"
                    type="button"
                    onclick="deleteNotification('${notification._id}')"
                >
                    Delete
                </button>


            </div>


        </div>

    `;


    return card;

}




function getNotificationIcon(
    type
) {

    switch (type) {

        case "registration":
            return "🎫";

        case "event":
            return "📅";

        case "venue":
            return "🏛️";

        case "approval":
            return "✓";

        case "system":
            return "🔔";

        default:
            return "🔔";

    }

}




function getNotificationIconClass(
    type
) {

    switch (type) {

        case "registration":
            return "success";

        case "event":
            return "event";

        case "venue":
            return "warning";

        case "approval":
            return "success";

        case "system":
            return "info";

        default:
            return "info";

    }

}




async function markRead(
    notificationId
) {

    if (!notificationId) {
        return;
    }


    try {

        const token =
            getNotificationToken();


        if (!token) {

            throw new Error(
                "Please login again."
            );

        }


        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/notifications/${notificationId}/read`,
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
            allNotifications.find(
                function (item) {

                    return (
                        item._id ===
                        notificationId
                    );

                }
            );


        if (notification) {

            notification.isRead =
                true;

        }


        renderNotifications();

        updateUnreadCount();


        showToast(
            "Notification marked as read."
        );


    } catch (error) {

        console.error(
            "Mark Read Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to update notification."
        );

    }

}




async function markAllRead() {

    try {

        const token =
            getNotificationToken();


        if (!token) {

            throw new Error(
                "Please login again."
            );

        }


        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/notifications/read-all`,
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
                "Failed to mark all notifications as read."
            );

        }




        allNotifications.forEach(
            function (notification) {

                notification.isRead =
                    true;

            }
        );


        renderNotifications();

        updateUnreadCount();


        showToast(
            "All notifications marked as read."
        );


    } catch (error) {

        console.error(
            "Mark All Read Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to update notifications."
        );

    }

}




async function deleteNotification(
    notificationId
) {

    if (!notificationId) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this notification?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const token =
            getNotificationToken();


        if (!token) {

            throw new Error(
                "Please login again."
            );

        }


        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/notifications/${notificationId}`,
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


        allNotifications =
            allNotifications.filter(
                function (notification) {

                    return (
                        notification._id !==
                        notificationId
                    );

                }
            );


        renderNotifications();

        updateUnreadCount();


        showToast(
            "Notification deleted."
        );


    } catch (error) {

        console.error(
            "Delete Notification Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete notification."
        );

    }

}




async function deleteAllNotifications() {

    if (
        allNotifications.length === 0
    ) {

        showToast(
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
            getNotificationToken();


        if (!token) {

            throw new Error(
                "Please login again."
            );

        }


        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/notifications`,
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


        allNotifications = [];


        renderNotifications();

        updateUnreadCount();


        showToast(
            "All notifications deleted."
        );


    } catch (error) {

        console.error(
            "Delete All Notifications Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete notifications."
        );

    }

}




function updateUnreadCount(
    serverCount = null
) {

    let count;


    if (
        typeof serverCount === "number"
    ) {

        count =
            serverCount;

    } else {

        count =
            allNotifications.filter(
                function (notification) {

                    return !notification.isRead;

                }
            ).length;

    }


    const countElement =
        document.getElementById(
            "notificationCount"
        );


    if (!countElement) {
        return;
    }


    countElement.textContent =
        count;


    if (count === 0) {

        countElement.style.display =
            "none";

    } else {

        countElement.style.display =
            "grid";

    }

}




function openEvent(
    eventId
) {

    if (!eventId) {

        showToast(
            "Event information is not available."
        );

        return;

    }


    window.location.href =
        `event-details.html?id=${encodeURIComponent(eventId)}`;

}




function openMyEvents() {

    window.location.href =
        "my-events.html";

}




function openVenues() {

    window.location.href =
        "venues.html";

}




function openProfile() {

    window.location.href =
        "profile.html";

}




function formatNotificationTime(
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




function showNotificationError(
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




function showToast(
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




function escapeHTML(
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

window.loadNotifications =
    loadNotifications;

window.filterNotifications =
    filterNotifications;

window.markRead =
    markRead;

window.markAllRead =
    markAllRead;

window.deleteNotification =
    deleteNotification;

window.deleteAllNotifications =
    deleteAllNotifications;

window.openEvent =
    openEvent;

window.openMyEvents =
    openMyEvents;

window.openVenues =
    openVenues;

window.openProfile =
    openProfile;

window.showToast =
    showToast;