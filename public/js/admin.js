document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const systemId = urlParams.get('id');
    const providedSecret = urlParams.get('secret');

    if (systemId && providedSecret) {
        validateSecret(systemId, providedSecret);
    } else {
        showError('Missing parameters', 'Both system ID and secret are required.');
    }
});

function validateSecret(systemId, providedSecret) {
    fetch(`/api/systems/secret/${systemId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.secret === providedSecret) {
                initializeAdminPanel(systemId);
            } else {
                showError('Invalid secret', 'The provided secret does not match the system secret.');
            }
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Error validating secret', `Unable to validate secret. Error: ${error.message}`);
        });
}

function initializeAdminPanel(systemId) {
    fetchSystemDetails(systemId);
    
    // Ensure QRCode library is loaded before generating QR code
    if (typeof QRCode !== 'undefined') {
        generateQRCode(systemId);
    } else {
        console.error('QRCode library not loaded');
    }

    // Add this new code to set up the copy-paste link
    setupCopyPasteLink(systemId);

    // Connect to Socket.IO
    const socket = io();

    // Listen for system updates
    socket.on('systemUpdated', function(updatedSystem) {
        if (updatedSystem._id === systemId) {
            fetchSystemDetails(systemId);
        }
    });

    // Listen for new ticket creation
    socket.on('newTicket', function(newTicket) {
        if (newTicket.systemId === systemId) {
            fetchSystemDetails(systemId);
        }
    });

    // Add event listeners for the buttons
    const nextButton = document.getElementById('next-button');
    const toggleActiveButton = document.getElementById('toggle-active-button');

    nextButton.addEventListener('click', () => {
        callNextTicket(systemId);
    });

    toggleActiveButton.addEventListener('click', () => {
        toggleSystemActive(systemId);
    });

    const deleteButton = document.getElementById('delete-system-button');
    deleteButton.addEventListener('click', () => {
        deleteSystem(systemId);
    });
}

// Add this new function
function setupCopyPasteLink(systemId) {
    const linkInput = document.getElementById('copy-paste-link');
    const copyButton = document.getElementById('copy-button');

    // Get the current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('secret');

    // Create the admin URL with systemId and secret
    linkInput.value = `${window.location.origin}${window.location.pathname}?id=${systemId}&secret=${secret}`;

    // Add click event listener to the copy button
    copyButton.addEventListener('click', () => {
        linkInput.select();
        document.execCommand('copy');
    });
}

function fetchSystemDetails(systemId) {
    fetch(`/api/systems/${systemId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            updateSystemDetails(data.system);
            updateWaitingTickets(data.tickets);
            updateToggleActiveButton(data.system.isActive);
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Error loading system', `Unable to fetch system details. Error: ${error.message}`);
        });
}

function updateSystemDetails(system) {
    document.getElementById('system-name').innerText = system.name;
    document.getElementById('current-number').innerText = system.currentNumber;
    document.getElementById('average-wait-time').innerText = `${system.averageWaitTime.toFixed(1)} min`;
    
    const lastUpdated = new Date(system.updatedAt);
    document.getElementById('last-updated').innerText = formatDate(lastUpdated);
}

function updateWaitingTickets(tickets) {
    const waitingTickets = tickets.filter(ticket => ticket.status === 'waiting');
    const waitingTicketsElement = document.getElementById('waiting-tickets');
    
    if (waitingTickets.length > 0) {
        waitingTicketsElement.innerHTML = '<h3>Waiting Tickets</h3>';
        const ticketList = document.createElement('ul');
        waitingTickets.forEach(ticket => {
            const ticketItem = document.createElement('li');
            ticketItem.textContent = `Ticket ${ticket.number}`;
            ticketList.appendChild(ticketItem);
        });
        waitingTicketsElement.appendChild(ticketList);
    } else {
        waitingTicketsElement.innerHTML = '<p>No waiting tickets</p>';
    }
}

function updateToggleActiveButton(isActive) {
    const toggleActiveButton = document.getElementById('toggle-active-button');
    toggleActiveButton.textContent = isActive ? 'Deactivate' : 'Activate';
}

function callNextTicket(systemId) {
    fetch(`/api/systems/${systemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(updatedSystem => {
        fetchSystemDetails(systemId);
    })
    .catch(error => {
        console.error('Error calling next ticket:', error);
        alert('Error calling next ticket. Please try again.');
    });
}

function toggleSystemActive(systemId) {
    fetch(`/api/systems/${systemId}`)
        .then(response => response.json())
        .then(data => {
            const newActiveState = !data.system.isActive;
            const endpoint = newActiveState ? 'activate' : 'deactivate';

            return fetch(`/api/systems/${systemId}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(updatedSystem => {
            fetchSystemDetails(systemId);
        })
        .catch(error => {
            console.error('Error toggling system active state:', error);
            alert('Error toggling system active state. Please try again.');
        });
}

function showError(title, message) {
    document.getElementById('system-name').innerText = title;
    document.getElementById('current-number').innerText = 'N/A';
    document.getElementById('average-wait-time').innerText = 'N/A';
    document.getElementById('last-updated').innerText = 'N/A';
    document.getElementById('waiting-tickets').innerHTML = `<p>${message}</p>`;
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function deleteSystem(systemId) {
    if (confirm('Are you sure you want to delete this system? This action cannot be undone.')) {
        fetch(`/api/systems/${systemId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(deletedSystem => {
            alert('System successfully deleted.');
            window.location.href = 'index.html'; // Redirect to the main page
        })
        .catch(error => {
            console.error('Error deleting system:', error);
            alert('Error deleting system. Please try again.');
        });
    }
}

