import express from 'express';
import { State, validateState, validateUpdateState } from '../models/state.js';
import { io } from '../index.js';

const router = express.Router();
router.use(express.json());

router.get('/all', async (req, res) => {
    try {
        const states = await State.find().select('-secret').sort('-createdAt');
        res.send(states);
    } catch (error) {
        res.status(500).send('Error retrieving states: ' + error.message);
    }
});

router.get('/secret/:id', async (req, res) => {
    try {
        const state = await State.findById(req.params.id);
        if (!state) return res.status(404).send('The state with the given ID was not found.');
        res.send({ secret: state.secret });
    } catch (error) {
        res.status(500).send('Error retrieving state secret: ' + error.message);
    }
});

router.post('/', async (req, res) => {
    const { error } = validateState(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const state = new State({
            name: req.body.name,
            isActive: req.body.isActive
        });

        await state.save();
        
        // Emit socket event for the newly created state
        io.emit('stateCreated', state);

        res.status(201).send(state);
    } catch (error) {
        res.status(500).send('Error creating state: ' + error.message);
    }
});

router.get('/active', async (req, res) => {
    try {
        const activeStates = await State.findActive();
        res.send(activeStates);
    } catch (error) {
        res.status(500).send('Error retrieving active states: ' + error.message);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const state = await State.findById(req.params.id);
        if (!state) return res.status(404).send('The state with the given ID was not found.');
        res.send(state);
    } catch (error) {
        res.status(500).send('Error retrieving state: ' + error.message);
    }
});

router.put('/:id', async (req, res) => {
    const { error } = validateUpdateState(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const state = await State.findById(req.params.id);
        if (!state) return res.status(404).send('The state with the given ID was not found.');

        if (req.body.isActive !== undefined) state.isActive = req.body.isActive;
        await state.save();

        // Emit an event to notify clients about the state update
        io.emit('stateUpdated', state);

        res.send(state);
    } catch (error) {
        res.status(500).send('Error updating state: ' + error.message);
    }
});

router.put('/:id/activate', async (req, res) => {
    try {
        const state = await State.findById(req.params.id);
        if (!state) return res.status(404).send('The state with the given ID was not found.');

        state.isActive = true;
        await state.save();
        
        // Emit socket event
        io.emit('stateUpdated', state);
        
        res.send(state);
    } catch (error) {
        res.status(500).send('Error activating state: ' + error.message);
    }
});

router.put('/:id/deactivate', async (req, res) => {
    try {
        const state = await State.findById(req.params.id);
        if (!state) return res.status(404).send('The state with the given ID was not found.');

        state.isActive = false;
        await state.save();
        
        // Emit socket event
        io.emit('stateUpdated', state);
        
        res.send(state);
    } catch (error) {
        res.status(500).send('Error deactivating state: ' + error.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const state = await State.findOneAndDelete({ _id: req.params.id });
        if (!state) return res.status(404).send('The state with the given ID was not found.');
        res.send(state);
    } catch (error) {
        res.status(500).send('Error deleting state: ' + error.message);
    }
});

export { router as statesRouter };
