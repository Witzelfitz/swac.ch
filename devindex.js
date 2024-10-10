import mongoose from 'mongoose';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { systemsRouter } from './routes/systems.js';
import { ticketsRouter } from './routes/tickets.js';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

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

// Export io for use in other files
export { io };

//Connecting to the Database
mongoose.connect('mongodb://localhost/ticketing', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

httpServer.listen(port, () => console.log(`Listening on port ${port}...`));