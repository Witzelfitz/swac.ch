import express from 'express';
import { System, validateSystem, validateUpdateSystem } from '../models/system.js';
import { Ticket } from '../models/ticket.js';
import { io } from '../index.js';

const router = express.Router();
router.use(express.json());

router.get('/all', async (req, res) => {
    try {
        const systems = await System.find().select('-secret').sort('-createdAt');
        res.send(systems);
    } catch (error) {
        res.status(500).send('Error retrieving systems: ' + error.message);
    }
});

router.get('/secret/:id', async (req, res) => {
    try {
        const system = await System.findById(req.params.id);
        if (!system) return res.status(404).send('The system with the given ID was not found.');
        res.send({ secret: system.secret });
    } catch (error) {
        res.status(500).send('Error retrieving system secret: ' + error.message);
    }
});

router.post('/', async (req, res) => {
    const { error } = validateSystem(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const system = new System({
            name: req.body.name,
            currentNumber: req.body.currentNumber,
            averageWaitTime: req.body.averageWaitTime,
            isActive: req.body.isActive
        });

        await system.save();
        
        // Emit socket event for the newly created system
        io.emit('systemCreated', system);

        res.status(201).send(system);
    } catch (error) {
        res.status(500).send('Error creating system: ' + error.message);
    }
});

router.get('/active', async (req, res) => {
    try {
        const activeSystems = await System.findActive();
        res.send(activeSystems);
    } catch (error) {
        res.status(500).send('Error retrieving active systems: ' + error.message);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const system = await System.findById(req.params.id);
        if (!system) return res.status(404).send('The system with the given ID was not found.');
        
        const tickets = await Ticket.find({ systemId: req.params.id }).sort('-createdAt');
        
        res.send({ system, tickets });
    } catch (error) {
        res.status(500).send('Error retrieving system and tickets: ' + error.message);
    }
});

router.put('/:id', async (req, res) => {
    const { error } = validateUpdateSystem(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const system = await System.findById(req.params.id);
        if (!system) return res.status(404).send('The system with the given ID was not found.');

        // Find the oldest waiting ticket for this system
        const oldestWaitingTicket = await Ticket.findOne({ 
            systemId: req.params.id, 
            status: 'waiting' 
        }).sort('createdAt');

        if (oldestWaitingTicket) {
            // Update the ticket status to 'served'
            await oldestWaitingTicket.markAsServed();

            // Calculate new average wait time
            const newAverageWaitTime = await calculateAverageWaitTime(req.params.id);

            // Update the system
            if (req.body.name) system.name = req.body.name;
            system.currentNumber = oldestWaitingTicket.number;
            system.averageWaitTime = newAverageWaitTime;
            if (req.body.isActive !== undefined) system.isActive = req.body.isActive;

            await system.save();

            // Emit an event to notify clients about the system update
            io.emit('systemUpdated', system);
        } else {
            // If no waiting ticket, just update other fields
            if (req.body.name) system.name = req.body.name;
            if (req.body.isActive !== undefined) system.isActive = req.body.isActive;
            await system.save();
        }

        res.send(system);
    } catch (error) {
        res.status(500).send('Error updating system: ' + error.message);
    }
});

router.put('/:id/activate', async (req, res) => {
    try {
        const system = await System.findById(req.params.id);
        if (!system) return res.status(404).send('The system with the given ID was not found.');

        system.isActive = true;
        await system.save();
        
        // Emit socket event
        io.emit('systemUpdated', system);
        
        res.send(system);
    } catch (error) {
        res.status(500).send('Error activating system: ' + error.message);
    }
});

router.put('/:id/deactivate', async (req, res) => {
    try {
        const system = await System.findById(req.params.id);
        if (!system) return res.status(404).send('The system with the given ID was not found.');

        system.isActive = false;
        await system.save();
        
        // Emit socket event
        io.emit('systemUpdated', system);
        
        res.send(system);
    } catch (error) {
        res.status(500).send('Error deactivating system: ' + error.message);
    }
});

// Helper function to calculate average wait time
async function calculateAverageWaitTime(systemId) {
    const servedTickets = await Ticket.find({ 
        systemId: systemId, 
        status: 'served',
        servedAt: { $exists: true },
        createdAt: { $exists: true }
    });

    if (servedTickets.length === 0) return 0;

    const totalWaitTime = servedTickets.reduce((sum, ticket) => {
        return sum + (ticket.servedAt - ticket.createdAt);
    }, 0);

    return totalWaitTime / servedTickets.length / (1000 * 60); // Convert to minutes
}

router.delete('/:id', async (req, res) => {
    try {
        const system = await System.findOneAndDelete({ _id: req.params.id });
        if (!system) return res.status(404).send('The system with the given ID was not found.');
        res.send(system);
    } catch (error) {
        res.status(500).send('Error deleting system: ' + error.message);
    }
});

export { router as systemsRouter };