document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const systemId = urlParams.get('system');

    if (!systemId) {
        alert('No system ID provided. Please go back and select a system.');
        return;
    }

    try {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ systemId: systemId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newTicket = await response.json();
        window.location.href = `/myTicket.html?id=${newTicket._id}`;
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('An error occurred while creating your ticket. Please try again.');
    }
});

console.log("newTicket.js loaded");