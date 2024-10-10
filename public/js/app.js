document.addEventListener('DOMContentLoaded', function() {
    // Fetch and display existing systems
    fetch('/api/systems/all')
        .then(response => response.json())
        .then(data => {
            const systemList = document.getElementById('system-list');
            data.forEach(system => {
                const systemItem = document.createElement('div');
                systemItem.className = 'system-item';
                systemItem.dataset.id = system._id;
                systemItem.innerHTML = `
                    <a href="detail.html?id=${system._id}">${system.name}</a>
                    <div class="system-info">
                        <div class="current-number">Current Number: ${system.currentNumber}</div>
                        <div class="average-wait-time">Average Wait Time: ${system.averageWaitTime.toFixed(1)} min</div>
                    </div>
                    <div class="system-status ${system.isActive ? 'active' : 'inactive'}">
                        ${system.isActive ? 'Active' : 'Inactive'}
                    </div>
                `;
                systemList.appendChild(systemItem);
            });
        })
        .catch(error => console.error('Error fetching systems:', error));

    // Handle new system form submission
    document.getElementById('new-system-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const currentNumber = 0; // Starting with 0
        const averageWaitTime = 0; // Starting with 0
        const isActive = true; // New systems are active by default

        const dataToSend = { 
            name: name, 
            currentNumber: currentNumber, 
            averageWaitTime: averageWaitTime, 
            isActive: isActive 
        };
        console.log('Data being sent:', dataToSend);

        fetch('/api/systems', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => response.json())
        .then(data => {
            socket.emit('newSystem', data);
            window.location.href = `admin.html?id=${data._id}&secret=${data.secret}`;
        })
        .catch(error => console.error('Error adding system:', error));
    });

    // Connect to Socket.IO
    const socket = io();

    // Listen for system updates
    socket.on('systemUpdated', function(updatedSystem) {
        // Update the system in the list if it exists
        const systemItem = document.querySelector(`.system-item[data-id="${updatedSystem._id}"]`);
        if (systemItem) {
            systemItem.querySelector('.current-number').textContent = `Current Number: ${updatedSystem.currentNumber}`;
            systemItem.querySelector('.average-wait-time').textContent = `Average Wait Time: ${updatedSystem.averageWaitTime.toFixed(1)} min`;
            const statusElement = systemItem.querySelector('.system-status');
            statusElement.textContent = updatedSystem.isActive ? 'Active' : 'Inactive';
            statusElement.className = `system-status ${updatedSystem.isActive ? 'active' : 'inactive'}`;
        }
    });

    // Add this new event listener
    socket.on('systemCreated', function(newSystem) {
        const systemList = document.getElementById('system-list');
        const systemItem = document.createElement('div');
        systemItem.className = 'system-item';
        systemItem.dataset.id = newSystem._id;
        systemItem.innerHTML = `
            <a href="detail.html?id=${newSystem._id}">${newSystem.name}</a>
            <div class="system-info">
                <div class="current-number">Current Number: ${newSystem.currentNumber}</div>
                <div class="average-wait-time">Average Wait Time: ${newSystem.averageWaitTime.toFixed(1)} min</div>
            </div>
            <div class="system-status ${newSystem.isActive ? 'active' : 'inactive'}">
                ${newSystem.isActive ? 'Active' : 'Inactive'}
            </div>
        `;
        systemList.appendChild(systemItem);
    });

    // Listen for new tickets
    socket.on('newTicket', function(newTicket) {
        // You can add logic here to update the UI if needed
        console.log('New ticket created:', newTicket);
    });

    // Listen for ticket updates
    socket.on('ticketUpdated', function(updatedTicket) {
        // You can add logic here to update the UI if needed
        console.log('Ticket updated:', updatedTicket);
    });
});