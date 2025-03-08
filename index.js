import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { systemsRouter } from './routes/systems.js';
import { ticketsRouter } from './routes/tickets.js';
import { statesRouter } from './routes/states.js';
import { studentsRouter } from './routes/students.js';
import { Server } from 'socket.io';
import cors from 'cors';

const corsOptions = {
  origin: 'https://swac.ch', // or "http://localhost:5500"
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5001;
const pw = process.env.PW || 'blub';
const user = process.env.USER || 'blub22';
const db = process.env.DB || 'ticketing';

const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {

  socket.on('disconnect', () => {
    
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/', (req, res) => {
    res.send('Fragen zur API? Wende dich an Benjamin Hanimann Witzelfitz Consulting GmbH.');
});

app.use('/api/systems', systemsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/states', statesRouter);
app.use('/api/students', studentsRouter);
// Export io for use in other files
export { io };

//Connecting to the Database
mongoose.connect(`mongodb://${user}:${pw}@127.0.0.1:27017/${db}?authSource=admin`)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

httpServer.listen(port, () => console.log(`Listening on port ${port}...`));