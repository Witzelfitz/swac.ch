document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const stateId = urlParams.get('id');

    if (stateId) {
        fetchStateDetails(stateId);
        fetchStudents(stateId);

        // Connect to Socket.IO
        const socket = io();

        // Listen for state updates
        socket.on('stateUpdated', function(updatedState) {
            if (updatedState._id === stateId) {
                fetchStateDetails(stateId);
            }
        });

        // Listen for new students
        socket.on('newStudent', function(newStudent) {
            if (newStudent.stateId === stateId) {
                fetchStudents(stateId);
            }
        });

        // Listen for student updates
        socket.on('studentUpdated', function(updatedStudent) {
            if (updatedStudent.stateId === stateId) {
                fetchStudents(stateId);
            }
        });
    } else {
        showError('No state selected', 'Please select a state from the main page.');
    }
});

function fetchStateDetails(stateId) {
    fetch(`/api/states/${stateId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(state => {
            updateStateDetails(state);
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Error loading state', `Unable to fetch state details. Error: ${error.message}`);
        });
}

function fetchStudents(stateId) {
    fetch(`/api/students/state/${stateId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(students => {
            updateStudentsList(students);
        })
        .catch(error => {
            console.error('Error details:', error);
            showError('Error loading students', `Unable to fetch students. Error: ${error.message}`);
        });
}

function updateStateDetails(state) {
    document.getElementById('state-name').innerText = state.name;
    document.getElementById('state-status').innerText = state.isActive ? 'Active' : 'Inactive';
    
    const lastUpdated = new Date(state.updatedAt);
    document.getElementById('last-updated').innerText = formatDate(lastUpdated);
}

function updateStudentsList(students) {
    const studentsTableBody = document.querySelector('#students-table tbody');
    studentsTableBody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${getStatusText(student.status)}</td>
            <td>${student.wishedSpeed !== undefined ? student.wishedSpeed : '-'}</td>
            <td>${student.courseHappiness !== undefined ? student.courseHappiness : '-'}</td>
        `;
        studentsTableBody.appendChild(row);
    });
}

function getStatusText(status) {
    const statusMap = {
        0: 'RED',
        1: 'YELLOW',
        2: 'GREEN'
    };
    return statusMap[status] || 'Unknown';
}

function showError(title, message) {
    document.getElementById('state-name').innerText = title;
    document.getElementById('state-status').innerText = 'N/A';
    document.getElementById('last-updated').innerText = 'N/A';
    document.getElementById('students-list').innerHTML = `<p>${message}</p>`;
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}
