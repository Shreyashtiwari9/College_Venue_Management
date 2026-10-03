const ADMIN_FEEDBACK_API_BASE_URL = "/api";

document.addEventListener("DOMContentLoaded", function () {
    protectPage("admin");

    loadFeedback();

    const searchInput = document.getElementById("search");
    const ratingSelect = document.getElementById("rating");

    if (searchInput) {
        searchInput.addEventListener("input", filterFeedback);
    }

    if (ratingSelect) {
        ratingSelect.addEventListener("change", filterFeedback);
    }
});

async function loadFeedback() {
    const feedbackList = document.getElementById("feedbackList");

    if (!feedbackList) {
        return;
    }

    feedbackList.innerHTML = `
        <div class="feedback-loading">
            Loading feedback...
        </div>
    `;

    try {
        const token = getAuthToken();

        const response = await fetch(
            `${ADMIN_FEEDBACK_API_BASE_URL}/feedback`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load feedback."
            );
        }

        updateStatistics(data.statistics);

        renderFeedback(data.feedback);

    } catch (error) {
        console.error("Feedback Loading Error:", error);

        feedbackList.innerHTML = `
            <div class="feedback-error">
                <h3>Unable to load feedback</h3>
                <p>${escapeHTML(error.message)}</p>
                <button onclick="loadFeedback()" class="btn btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }
}

function updateStatistics(statistics) {
    const averageRating = document.querySelector(
        ".feedback-card:nth-child(1) .rating"
    );

    const averageDescription = document.querySelector(
        ".feedback-card:nth-child(1) p"
    );

    const positiveRating = document.querySelector(
        ".feedback-card:nth-child(2) .rating"
    );

    const positiveDescription = document.querySelector(
        ".feedback-card:nth-child(2) p"
    );

    const pendingRating = document.querySelector(
        ".feedback-card:nth-child(3) .rating"
    );

    const pendingDescription = document.querySelector(
        ".feedback-card:nth-child(3) p"
    );

    if (averageRating) {
        averageRating.textContent =
            `${statistics.averageRating} / 5`;
    }

    if (averageDescription) {
        averageDescription.textContent =
            `Based on ${statistics.totalResponses} responses`;
    }

    if (positiveRating) {
        positiveRating.textContent =
            `${statistics.positiveFeedback}%`;
    }

    if (positiveDescription) {
        positiveDescription.textContent =
            "Users satisfied with services";
    }

    if (pendingRating) {
        pendingRating.textContent =
            statistics.pendingReviews;
    }

    if (pendingDescription) {
        pendingDescription.textContent =
            "Need administrative attention";
    }
}

function renderFeedback(feedback) {
    const feedbackList = document.getElementById("feedbackList");

    if (!feedbackList) {
        return;
    }

    if (!feedback || feedback.length === 0) {
        feedbackList.innerHTML = `
            <div class="feedback-empty">
                <h3>No Feedback Found</h3>
                <p>No feedback has been submitted yet.</p>
            </div>
        `;

        return;
    }

    feedbackList.innerHTML = feedback.map(function (item) {

        const rating = Number(item.rating);

        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);

        const userName =
            item.user && item.user.name
                ? item.user.name
                : "Anonymous User";

        const eventName =
            item.event && item.event.title
                ? item.event.title
                : "General Feedback";

        const date = item.createdAt
            ? formatDate(item.createdAt)
            : "";

        const statusClass =
            item.status === "reviewed"
                ? "reviewed"
                : "pending";

        const statusText =
            item.status === "reviewed"
                ? "Reviewed"
                : "Pending";

        return `
            <div
                class="feedback"
                data-rating="${rating}"
                data-search="${escapeHTML(
                    `${item.title} ${item.message} ${userName} ${eventName}`
                ).toLowerCase()}"
            >

                <div class="feedback-top">

                    <div class="stars">
                        ${stars}
                    </div>

                    <span class="feedback-status ${statusClass}">
                        ${statusText}
                    </span>

                </div>

                <h3>
                    ${escapeHTML(item.title)}
                </h3>

                <p>
                    "${escapeHTML(item.message)}"
                </p>

                <small>
                    ${escapeHTML(userName)}
                    •
                    ${escapeHTML(eventName)}
                    ${date ? ` • ${date}` : ""}
                </small>

                ${
                    item.adminReply
                        ? `
                            <div class="admin-reply">
                                <strong>Admin Reply:</strong>
                                <p>${escapeHTML(item.adminReply)}</p>
                            </div>
                        `
                        : ""
                }

                <div class="feedback-actions">

                    ${
                        item.status === "pending"
                            ? `
                                <button
                                    class="btn btn-primary"
                                    onclick="markAsReviewed('${item._id}')"
                                >
                                    Mark Reviewed
                                </button>
                            `
                            : `
                                <button
                                    class="btn btn-outline"
                                    onclick="markAsPending('${item._id}')"
                                >
                                    Mark Pending
                                </button>
                            `
                    }

                    <button
                        class="btn btn-danger"
                        onclick="deleteFeedback('${item._id}')"
                    >
                        Delete
                    </button>

                </div>

                <hr>

            </div>
        `;
    }).join("");

    filterFeedback();
}

function filterFeedback() {
    const searchInput = document.getElementById("search");
    const ratingSelect = document.getElementById("rating");

    const searchValue =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const ratingValue =
        ratingSelect
            ? ratingSelect.value
            : "";

    const feedbackItems =
        document.querySelectorAll("#feedbackList .feedback");

    let visibleCount = 0;

    feedbackItems.forEach(function (item) {

        const itemRating =
            item.dataset.rating || "";

        const itemSearch =
            item.dataset.search || "";

        const ratingMatch =
            !ratingValue ||
            itemRating === ratingValue;

        const searchMatch =
            !searchValue ||
            itemSearch.includes(searchValue);

        if (ratingMatch && searchMatch) {
            item.style.display = "";
            visibleCount++;
        } else {
            item.style.display = "none";
        }
    });

    const existingEmpty =
        document.querySelector(
            "#feedbackList .filter-empty"
        );

    if (existingEmpty) {
        existingEmpty.remove();
    }

    if (visibleCount === 0 && feedbackItems.length > 0) {
        const message = document.createElement("div");

        message.className = "filter-empty";

        message.innerHTML = `
            <h3>No Matching Feedback</h3>
            <p>Try changing your search or rating filter.</p>
        `;

        document.getElementById("feedbackList").appendChild(message);
    }
}

async function updateFeedbackStatus(id, status) {
    try {
        const token = getAuthToken();

        const response = await fetch(
            `${ADMIN_FEEDBACK_API_BASE_URL}/feedback/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: status
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to update feedback."
            );
        }

        await loadFeedback();

    } catch (error) {
        console.error("Feedback Update Error:", error);

        alert(
            error.message ||
            "Unable to update feedback."
        );
    }
}

async function markAsReviewed(id) {
    await updateFeedbackStatus(
        id,
        "reviewed"
    );
}

async function markAsPending(id) {
    await updateFeedbackStatus(
        id,
        "pending"
    );
}

async function deleteFeedback(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this feedback?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const token = getAuthToken();

        const response = await fetch(
            `${ADMIN_FEEDBACK_API_BASE_URL}/feedback/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to delete feedback."
            );
        }

        await loadFeedback();

    } catch (error) {
        console.error("Feedback Delete Error:", error);

        alert(
            error.message ||
            "Unable to delete feedback."
        );
    }
}

function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
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

function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent =
        value === undefined ||
        value === null
            ? ""
            : String(value);

    return div.innerHTML;
}