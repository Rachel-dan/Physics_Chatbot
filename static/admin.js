

// // static/admin.js

// // Store chart instances to prevent re-creation issues
// let activityChartInstance = null;
// let sessionLengthChartInstance = null;

// document.addEventListener('DOMContentLoaded', () => {
//     // Fetch both sets of data when the page loads
//     fetchAdminStats();
//     fetchAdminAnalytics();

//     // Logout button event listener (unchanged)
//     const logoutBtn = document.getElementById('admin-logout-btn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', async () => {
//             await fetch('/logout');
//             window.location.href = '/';
//         });
//     }
// });

// async function fetchAdminStats() {
//     try {
//         const response = await fetch('/api/admin/stats');
//         if (!response.ok) throw new Error('Failed to fetch basic stats');
//         const stats = await response.json();
//         updateDashboard(stats);
//     } catch (error) {
//         console.error("Error fetching stats:", error);
//     }
// }

// async function fetchAdminAnalytics() {
//     try {
//         const response = await fetch('/api/admin/analytics');
//         if (!response.ok) throw new Error('Failed to fetch analytics');
//         const analytics = await response.json();
        
//         // Update the new stat card
//         document.getElementById('avg-session-duration').textContent = formatDuration(analytics.average_session_duration_seconds);
        
//         // Render all visual components
//         renderActivityChart(analytics.chat_activity);
//         renderSessionLengthChart(analytics.session_length_distribution);
//         renderTopUsersTable(analytics.top_active_users);

//     } catch (error) {
//         console.error("Error fetching analytics:", error);
//     }
// }

// function updateDashboard(stats) {
//     document.getElementById('total-users').textContent = stats.total_users;
//     document.getElementById('total-conversations').textContent = stats.total_conversations;
//     document.getElementById('total-messages').textContent = stats.total_messages;
//     // Note: The satisfaction rate card was removed in the HTML to make space for charts.
//     // If you want to keep it, you need to add it back to admin.html.
// }

// // --- Chart Rendering Functions ---

// function renderActivityChart(chatActivity) {
//     const ctx = document.getElementById('activity-chart').getContext('2d');
//     if (activityChartInstance) {
//         activityChartInstance.destroy();
//     }
//     activityChartInstance = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: chatActivity.labels,
//             datasets: [{
//                 label: 'Messages per Day',
//                 data: chatActivity.data,
//                 borderColor: '#4a4a8a',
//                 backgroundColor: 'rgba(74, 74, 138, 0.1)',
//                 fill: true,
//                 tension: 0.3
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         precision: 0
//                     }
//                 }
//             }
//         }
//     });
// }

// function renderSessionLengthChart(sessionDist) {
//     const ctx = document.getElementById('session-length-chart').getContext('2d');
//      if (sessionLengthChartInstance) {
//         sessionLengthChartInstance.destroy();
//     }
//     sessionLengthChartInstance = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: sessionDist.labels,
//             datasets: [{
//                 label: 'Number of Sessions',
//                 data: sessionDist.data,
//                 backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     display: false
//                 }
//             },
//             scales: {
//                  y: {
//                     beginAtZero: true,
//                     ticks: {
//                         precision: 0
//                     }
//                 }
//             }
//         }
//     });
// }

// // --- Table Rendering and Helper Functions ---

// function renderTopUsersTable(topUsers) {
//     const tableBody = document.querySelector('#top-users-table tbody');
//     tableBody.innerHTML = ''; // Clear existing data
    
//     if (topUsers.length === 0) {
//         tableBody.innerHTML = '<tr><td colspan="2">No user activity recorded yet.</td></tr>';
//         return;
//     }

//     topUsers.forEach(user => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${user.username}</td>
//             <td>${formatDuration(user.total_time_seconds)}</td>
//         `;
//         tableBody.appendChild(row);
//     });
// }

// function formatDuration(totalSeconds) {
//     if (totalSeconds < 60) {
//         return `${Math.round(totalSeconds)}s`;
//     }
//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = Math.round(totalSeconds % 60);
//     return `${minutes}m ${seconds}s`;
// }
































// // static/admin.js

// // Store chart instances to prevent re-creation issues
// const API_URL = 'https://physics-chatbot-bd3o.onrender.com'; // <-- IMPORTANT: Use your actual Render URL
// let activityChartInstance = null;
// let sessionLengthChartInstance = null;
// let feedbackChartInstance = null; // +++ NEW: Instance for the feedback chart

// document.addEventListener('DOMContentLoaded', () => {
//     // Fetch both sets of data when the page loads
//     fetchAdminStats();
//     fetchAdminAnalytics();

//     // Logout button event listener (unchanged)
//     const logoutBtn = document.getElementById('admin-logout-btn');
//     if (logoutBtn) {
//         logoutBtn.addEventListener('click', async () => {
//             await fetch(`${API_URL}/logout`);
//             window.location.href = '/';
//         });
//     }
// });

// async function fetchAdminStats() {
//     try {
//         const response = await fetch(`${API_URL}/api/admin/stats`);
//         if (!response.ok) throw new Error('Failed to fetch basic stats');
//         const stats = await response.json();
//         updateDashboard(stats);
//     } catch (error) {
//         console.error("Error fetching stats:", error);
//     }
// }

// async function fetchAdminAnalytics() {
//     try {
//         const response = await fetch(`${API_URL}/api/admin/analytics`);
//         if (!response.ok) throw new Error('Failed to fetch analytics');
//         const analytics = await response.json();
        
//         // Update the new stat card
//         document.getElementById('avg-session-duration').textContent = formatDuration(analytics.average_session_duration_seconds);
        
//         // Render all visual components
//         renderActivityChart(analytics.chat_activity);
//         renderSessionLengthChart(analytics.session_length_distribution);
//         renderTopUsersTable(analytics.top_active_users);
//         renderFeedbackChart(analytics.feedback_distribution); // +++ NEW: Call the new chart function

//     } catch (error) {
//         console.error("Error fetching analytics:", error);
//     }
// }

// function updateDashboard(stats) {
//     document.getElementById('total-users').textContent = stats.total_users;
//     document.getElementById('total-conversations').textContent = stats.total_conversations;
//     document.getElementById('total-messages').textContent = stats.total_messages;
// }

// // --- Chart Rendering Functions ---

// function renderActivityChart(chatActivity) {
//     const ctx = document.getElementById('activity-chart').getContext('2d');
//     if (activityChartInstance) {
//         activityChartInstance.destroy();
//     }
//     activityChartInstance = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: chatActivity.labels,
//             datasets: [{
//                 label: 'Messages per Day',
//                 data: chatActivity.data,
//                 borderColor: '#4a4a8a',
//                 backgroundColor: 'rgba(74, 74, 138, 0.1)',
//                 fill: true,
//                 tension: 0.3
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         precision: 0
//                     }
//                 }
//             }
//         }
//     });
// }

// function renderSessionLengthChart(sessionDist) {
//     const ctx = document.getElementById('session-length-chart').getContext('2d');
//      if (sessionLengthChartInstance) {
//         sessionLengthChartInstance.destroy();
//     }
//     sessionLengthChartInstance = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: sessionDist.labels,
//             datasets: [{
//                 label: 'Number of Sessions',
//                 data: sessionDist.data,
//                 backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     display: false
//                 }
//             },
//             scales: {
//                  y: {
//                     beginAtZero: true,
//                     ticks: {
//                         precision: 0
//                     }
//                 }
//             }
//         }
//     });
// }

// // +++ NEW: Function to render the feedback bar chart +++
// function renderFeedbackChart(feedbackDist) {
//     const ctx = document.getElementById('feedback-chart').getContext('2d');
//     if (feedbackChartInstance) {
//         feedbackChartInstance.destroy();
//     }
//     feedbackChartInstance = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: feedbackDist.labels,
//             datasets: [{
//                 label: 'Number of Feedbacks',
//                 data: feedbackDist.data,
//                 backgroundColor: [
//                     '#28a745', // Green for Positive
//                     '#dc3545'  // Red for Negative
//                 ],
//                 borderColor: [
//                     '#28a745',
//                     '#dc3545'
//                 ],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     display: false // Hide the legend as the labels are clear
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     ticks: {
//                         precision: 0 // Ensure y-axis has whole numbers
//                     }
//                 }
//             }
//         }
//     });
// }


// // --- Table Rendering and Helper Functions ---

// function renderTopUsersTable(topUsers) {
//     const tableBody = document.querySelector('#top-users-table tbody');
//     tableBody.innerHTML = ''; // Clear existing data
    
//     if (topUsers.length === 0) {
//         tableBody.innerHTML = '<tr><td colspan="2">No user activity recorded yet.</td></tr>';
//         return;
//     }

//     topUsers.forEach(user => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>${user.username}</td>
//             <td>${formatDuration(user.total_time_seconds)}</td>
//         `;
//         tableBody.appendChild(row);
//     });
// }

// function formatDuration(totalSeconds) {
//     if (totalSeconds < 60) {
//         return `${Math.round(totalSeconds)}s`;
//     }
//     const minutes = Math.floor(totalSeconds / 60);
//     const seconds = Math.round(totalSeconds % 60);
//     return `${minutes}m ${seconds}s`;
// }


































// static/admin.js

// The single source of truth for your backend's URL.
const API_URL = 'https://physics-chatbot-bd3o.onrender.com'; // <-- Use your actual backend URL

// New entry point for the dashboard.
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

/**
 * Checks if the user is an authenticated admin.
 * If yes, it loads the dashboard data.
 * If no, it redirects them to the main page.
 */
async function initializeDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/check_auth`, {
            credentials: 'include' // IMPORTANT: This sends the session cookie.
        });

        if (!response.ok) throw new Error('Auth check failed');

        const authData = await response.json();

        // SECURITY CHECK: User must be logged in AND be an admin.
        if (authData.logged_in && authData.is_admin) {
            // If authorized, set up the page and fetch data.
            setupEventListeners();
            fetchAdminStats();
            fetchAdminAnalytics();
        } else {
            // If not an admin, redirect to the main page.
            alert('Access denied. You must be an admin to view this page.');
            window.location.href = '/index.html'; // Or '/'
        }
    } catch (error) {
        console.error("Authentication check failed:", error);
        alert('Could not verify admin status. Redirecting to login.');
        window.location.href = '/index.html'; // Or '/'
    }
}

/**
 * Centralized place to add event listeners for the page.
 */
function setupEventListeners() {
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch(`${API_URL}/logout`, { credentials: 'include' });
            // Redirect to the main page after logout, which will show the login form.
            window.location.href = '/index.html';
        });
    }
}

// Store chart instances to prevent re-creation issues
let activityChartInstance = null;
let sessionLengthChartInstance = null;
let feedbackChartInstance = null;

// This is a helper to ensure all fetch calls send credentials.
const fetchWithCredentials = (url, options = {}) => {
    return fetch(url, { ...options, credentials: 'include' });
};

async function fetchAdminStats() {
    try {
        // Use the full API_URL and send credentials
        const response = await fetchWithCredentials(`${API_URL}/api/admin/stats`);
        if (!response.ok) throw new Error('Failed to fetch basic stats');
        const stats = await response.json();
        updateDashboard(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        document.getElementById('total-users').textContent = 'Error';
    }
}

async function fetchAdminAnalytics() {
    try {
        // Use the full API_URL and send credentials
        const response = await fetchWithCredentials(`${API_URL}/api/admin/analytics`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const analytics = await response.json();
        
        document.getElementById('avg-session-duration').textContent = formatDuration(analytics.average_session_duration_seconds);
        
        renderActivityChart(analytics.chat_activity);
        renderSessionLengthChart(analytics.session_length_distribution);
        renderFeedbackChart(analytics.feedback_distribution);
        renderTopUsersTable(analytics.top_active_users);
    } catch (error)
    {
        console.error("Error fetching analytics:", error);
        // Maybe hide the charts or show an error message.
    }
}

function updateDashboard(stats) {
    document.getElementById('total-users').textContent = stats.total_users;
    document.getElementById('total-conversations').textContent = stats.total_conversations;
    document.getElementById('total-messages').textContent = stats.total_messages;
}

// --- ALL CHART AND TABLE RENDERING FUNCTIONS BELOW THIS LINE ARE UNCHANGED ---
// (renderActivityChart, renderSessionLengthChart, renderFeedbackChart, renderTopUsersTable, formatDuration)

function renderActivityChart(chatActivity) {
    const ctx = document.getElementById('activity-chart').getContext('2d');
    if (activityChartInstance) activityChartInstance.destroy();
    activityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chatActivity.labels,
            datasets: [{
                label: 'Messages per Day',
                data: chatActivity.data,
                borderColor: '#4a4a8a',
                backgroundColor: 'rgba(74, 74, 138, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
}

function renderSessionLengthChart(sessionDist) {
    const ctx = document.getElementById('session-length-chart').getContext('2d');
    if (sessionLengthChartInstance) sessionLengthChartInstance.destroy();
    sessionLengthChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sessionDist.labels,
            datasets: [{
                label: 'Number of Sessions',
                data: sessionDist.data,
                backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
}

function renderFeedbackChart(feedbackDist) {
    const ctx = document.getElementById('feedback-chart').getContext('2d');
    if (feedbackChartInstance) feedbackChartInstance.destroy();
    feedbackChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: feedbackDist.labels,
            datasets: [{
                label: 'Number of Feedbacks',
                data: feedbackDist.data,
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
}

function renderTopUsersTable(topUsers) {
    const tableBody = document.querySelector('#top-users-table tbody');
    tableBody.innerHTML = '';
    if (topUsers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">No user activity recorded yet.</td></tr>';
        return;
    }
    topUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${user.username}</td><td>${formatDuration(user.total_time_seconds)}</td>`;
        tableBody.appendChild(row);
    });
}

function formatDuration(totalSeconds) {
    if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
}