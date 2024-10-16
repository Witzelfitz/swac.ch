let systemName; // Add this line at the top of the file, outside any function

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');

    if (ticketId) {
        fetchTicketDetails(ticketId);
    } else {
        showError('No ticket selected', 'Please select a ticket from the main page.');
    }
});

function fetchTicketDetails(ticketId) {
    fetch(`/api/tickets/${ticketId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(ticket => {
            fetchSystemDetails(ticket.systemId, ticket);
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Error loading ticket', `Unable to fetch ticket details. Error: ${error.message}`);
        });
}

function fetchSystemDetails(systemId, ticket) {
    fetch(`/api/systems/${systemId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            systemName = data.system.name; // Store the system name
            updateTicketDetails(ticket, systemName);
            if (ticket.status === 'waiting') {
                pollTicketStatus(ticket._id);
            }
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Error loading system', `Unable to fetch system details. Error: ${error.message}`);
        });
}

function updateTicketDetails(ticket, systemName) {
    document.getElementById('system-name').innerText = systemName;
    document.getElementById('current-number').innerText = ticket.number;
    document.getElementById('ticket-status').innerText = ticket.status;
    document.getElementById('ticket-created-at').innerText = formatDate(new Date(ticket.createdAt));

    if (ticket.status === 'served') {
        document.getElementById('ticket-container').classList.add('served');
        document.getElementById('served-message').classList.remove('hidden');
    }
}

function pollTicketStatus(ticketId) {
    setInterval(() => {
        fetch(`/api/tickets/${ticketId}`)
            .then(response => response.json())
            .then(ticket => {
                if (ticket.status === 'served') {
                    updateTicketDetails(ticket, systemName); // Use the stored systemName
                    clearInterval(pollTicketStatus);
                }
            })
            .catch(error => console.error('Error polling ticket status:', error));
    }, 5000); // Poll every 5 seconds
}

function showError(title, message) {
    document.getElementById('system-name').innerText = 'Error';
    document.getElementById('current-number').innerText = 'N/A';
    document.getElementById('ticket-status').innerText = 'N/A';
    document.getElementById('ticket-created-at').innerText = 'N/A';
    document.getElementById('served-message').innerText = `${title}: ${message}`;
    document.getElementById('served-message').classList.remove('hidden');
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}
