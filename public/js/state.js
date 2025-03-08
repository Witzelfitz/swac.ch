document.addEventListener('DOMContentLoaded', function() {
    // Fetch and display existing states
    fetch('/api/states/all')
        .then(response => response.json())
        .then(data => {
            const stateList = document.getElementById('state-list');
            data.forEach(state => {
                const stateItem = document.createElement('div');
                stateItem.className = 'state-item';
                stateItem.dataset.id = state._id;
                stateItem.innerHTML = `
                    <a href="course.html?id=${state._id}">${state.name}</a>
                    <div class="state-status ${state.isActive ? 'active' : 'inactive'}">
                        ${state.isActive ? 'Active' : 'Inactive'}
                    </div>
                `;
                stateList.appendChild(stateItem);
            });
        })
        .catch(error => console.error('Error fetching states:', error));

    // Handle new state form submission
    document.getElementById('new-state-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const isActive = true; // New states are active by default

        const dataToSend = { 
            name: name, 
            isActive: isActive 
        };
        console.log('Data being sent:', dataToSend);

        fetch('/api/states', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => response.json())
        .then(data => {
            socket.emit('newState', data);
            window.location.href = `admin.html?id=${data._id}&secret=${data.secret}`;
        })
        .catch(error => console.error('Error adding state:', error));
    });

    // Connect to Socket.IO
    const socket = io();

    // Listen for state updates
    socket.on('stateUpdated', function(updatedState) {
        // Update the state in the list if it exists
        const stateItem = document.querySelector(`.state-item[data-id="${updatedState._id}"]`);
        if (stateItem) {
            const statusElement = stateItem.querySelector('.state-status');
            statusElement.textContent = updatedState.isActive ? 'Active' : 'Inactive';
            statusElement.className = `state-status ${updatedState.isActive ? 'active' : 'inactive'}`;
        }
    });

    // Listen for new state creation
    socket.on('stateCreated', function(newState) {
        const stateList = document.getElementById('state-list');
        const stateItem = document.createElement('div');
        stateItem.className = 'state-item';
        stateItem.dataset.id = newState._id;
        stateItem.innerHTML = `
            <a href="course.html?id=${newState._id}">${newState.name}</a>
            <div class="state-status ${newState.isActive ? 'active' : 'inactive'}">
                ${newState.isActive ? 'Active' : 'Inactive'}
            </div>
        `;
        stateList.appendChild(stateItem);
    });

    // Add event listeners for activate/deactivate buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('activate-btn')) {
            const stateId = event.target.closest('.state-item').dataset.id;
            activateState(stateId);
        } else if (event.target.classList.contains('deactivate-btn')) {
            const stateId = event.target.closest('.state-item').dataset.id;
            deactivateState(stateId);
        }
    });
});

function activateState(stateId) {
    fetch(`/api/states/${stateId}/activate`, {
        method: 'PUT'
    })
    .then(response => response.json())
    .then(updatedState => {
        console.log('State activated:', updatedState);
    })
    .catch(error => console.error('Error activating state:', error));
}

function deactivateState(stateId) {
    fetch(`/api/states/${stateId}/deactivate`, {
        method: 'PUT'
    })
    .then(response => response.json())
    .then(updatedState => {
        console.log('State deactivated:', updatedState);
    })
    .catch(error => console.error('Error deactivating state:', error));
}
