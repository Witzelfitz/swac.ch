import express from 'express';
import { Ticket, validateTicket, validateTicketUpdate } from '../models/ticket.js';
import { io } from '../index.js';

const router = express.Router();
router.use(express.json());

router.get('/all', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort('-createdAt');
        res.send(tickets);
    } catch (error) {
        res.status(500).send('Error retrieving tickets: ' + error.message);
    }
});

router.post('/', async (req, res) => {
    const { error } = validateTicket(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const nextNumber = await Ticket.getNextTicketNumber(req.body.systemId);
        
        const ticket = new Ticket({
            systemId: req.body.systemId,
            number: nextNumber,
            status: req.body.status || 'waiting',
            createdAt: req.body.createdAt || new Date(),
            servedAt: req.body.servedAt
        });

        await ticket.save();

        // Emit an event to notify clients about the new ticket
        io.emit('newTicket', ticket);

        res.status(201).send(ticket);
    } catch (error) {
        res.status(500).send('Error creating ticket: ' + error.message);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send('The ticket with the given ID was not found.');
        res.send(ticket);
    } catch (error) {
        res.status(500).send('Error retrieving ticket: ' + error.message);
    }
});

router.put('/:id', async (req, res) => {
    const { error } = validateTicketUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send('The ticket with the given ID was not found.');

        if (req.body.status === 'served' && ticket.status !== 'served') {
            await ticket.markAsServed();
        } else {
            ticket.status = req.body.status;
            if (req.body.servedAt && req.body.status === 'served') {
                ticket.servedAt = req.body.servedAt;
            }
            await ticket.save();
        }

        // Emit an event to notify clients about the ticket update
        io.emit('ticketUpdated', ticket);

        res.send(ticket);
    } catch (error) {
        res.status(500).send('Error updating ticket: ' + error.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndRemove(req.params.id);
        if (!ticket) return res.status(404).send('The ticket with the given ID was not found.');
        res.send(ticket);
    } catch (error) {
        res.status(500).send('Error deleting ticket: ' + error.message);
    }
});

export { router as ticketsRouter };