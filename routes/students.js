import express from 'express';
import { Student, validateStudent, validateStudentUpdate } from '../models/student.js';
import { io } from '../index.js';

const router = express.Router();
router.use(express.json());

router.get('/all', async (req, res) => {
    try {
        const students = await Student.find().sort('-createdAt');
        res.send(students);
    } catch (error) {
        res.status(500).send('Error retrieving students: ' + error.message);
    }
});

router.post('/', async (req, res) => {
    const { error } = validateStudent(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const student = new Student({
            stateId: req.body.stateId,
            name: req.body.name,
            status: req.body.status || 0,
            wishedSpeed: req.body.wishedSpeed,
            courseHappiness: req.body.courseHappiness
        });

        await student.save();

        // Emit an event to notify clients about the new student
        io.emit('newStudent', student);

        res.status(201).send(student);
    } catch (error) {
        res.status(500).send('Error creating student: ' + error.message);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).send('The student with the given ID was not found.');
        res.send(student);
    } catch (error) {
        res.status(500).send('Error retrieving student: ' + error.message);
    }
});

router.put('/:id', async (req, res) => {
    const { error } = validateStudentUpdate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!student) return res.status(404).send('The student with the given ID was not found.');

        // Emit an event to notify clients about the student update
        io.emit('studentUpdated', student);

        res.send(student);
    } catch (error) {
        res.status(500).send('Error updating student: ' + error.message);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndRemove(req.params.id);
        if (!student) return res.status(404).send('The student with the given ID was not found.');
        res.send(student);
    } catch (error) {
        res.status(500).send('Error deleting student: ' + error.message);
    }
});

router.get('/state/:stateId', async (req, res) => {
    try {
        const students = await Student.find({ stateId: req.params.stateId }).sort('-createdAt');
        if (students.length === 0) return res.status(404).send('No students found for the given stateId.');
        res.send(students);
    } catch (error) {
        res.status(500).send('Error retrieving students by stateId: ' + error.message);
    }
});

export { router as studentsRouter };
