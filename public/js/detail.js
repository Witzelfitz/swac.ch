document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const systemId = urlParams.get('id');

    if (systemId) {
        fetchSystemDetails(systemId);
        
        // Ensure QRCode library is loaded before generating QR code
        if (typeof QRCode !== 'undefined') {
            generateQRCode(systemId);
        } else {
            console.error('QRCode library not loaded');
        }

        // Connect to Socket.IO
        const socket = io();

        // Create audio elements for alerts
        const alerts = {};
        for (let i = 0; i <= 7; i++) {
            alerts[`alert${i}`] = new Audio(`/audio/alert${i}.mp3`);
        }

        // Create a dropdown for sound selection
        const soundSelect = document.createElement('select');
        soundSelect.id = 'sound-select';
        for (let i = 0; i <= 7; i++) {
            const option = document.createElement('option');
            option.value = `alert${i}`;
            option.textContent = `Alert ${i}`;
            soundSelect.appendChild(option);
        }

        // Create a preview sound button
        const previewSoundButton = document.createElement('button');
        previewSoundButton.textContent = 'Preview Sound';
        previewSoundButton.className = 'preview-sound-button';

        // Create a button to request sound permission
        const soundPermissionButton = document.createElement('button');
        soundPermissionButton.textContent = 'Enable Sound Notifications';
        soundPermissionButton.className = 'sound-permission-button';

        // Create a container for sound controls
        const soundControlsContainer = document.createElement('div');
        soundControlsContainer.className = 'sound-controls';
        soundControlsContainer.appendChild(soundSelect);
        soundControlsContainer.appendChild(previewSoundButton);
        soundControlsContainer.appendChild(soundPermissionButton);

        // Add sound controls to the bottom of the detail-container
        document.querySelector('.detail-container').appendChild(soundControlsContainer);

        let soundEnabled = false;
        let currentSound = 'alert0';

        soundSelect.addEventListener('change', function(event) {
            currentSound = event.target.value;
        });

        previewSoundButton.addEventListener('click', function() {
            alerts[currentSound].play().catch(error => console.error('Error playing preview sound:', error));
        });

        soundPermissionButton.addEventListener('click', function() {
            soundEnabled = true;
            alerts[currentSound].play().then(() => {
                alerts[currentSound].pause();
                alerts[currentSound].currentTime = 0;
                soundPermissionButton.textContent = 'Sound Notifications Enabled';
                soundPermissionButton.disabled = true;
            }).catch(error => {
                console.error('Error enabling sound:', error);
            });
        });

        // Listen for system updates
        socket.on('systemUpdated', function(updatedSystem) {
            if (updatedSystem._id === systemId) {
                if (updatedSystem.currentNumber !== document.getElementById('current-number').innerText) {
                    if (soundEnabled) {
                        alerts[currentSound].play().catch(error => console.error('Error playing sound:', error));
                    }
                }
                fetchSystemDetails(systemId);
            }
        });

        // Listen for new tickets
        socket.on('newTicket', function(newTicket) {
            if (newTicket.systemId === systemId) {
                fetchSystemDetails(systemId);
            }
        });

        // Listen for ticket updates
        socket.on('ticketUpdated', function(updatedTicket) {
            if (updatedTicket.systemId === systemId) {
                fetchSystemDetails(systemId);
            }
        });
    } else {
        showError('No system selected', 'Please select a system from the main page.');
    }
});

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

function generateQRCode(systemId) {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const newTicketUrl = `${window.location.origin}/newTicket.html?system=${systemId}`;

    // Clear previous QR code if any
    qrCodeContainer.innerHTML = '';

    // Generate QR code
    new QRCode(qrCodeContainer, {
        text: newTicketUrl,
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Add a button to get a ticket
    const getTicketButton = document.createElement('button');
    getTicketButton.textContent = 'Get a Ticket';
    getTicketButton.className = 'get-ticket-button';
    getTicketButton.addEventListener('click', () => {
        window.location.href = newTicketUrl;
    });

    qrCodeContainer.appendChild(getTicketButton);
}

