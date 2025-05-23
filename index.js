const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRouter = require('./routes/auth');
const passwordRoutes = require('./routes/passwordRoutes')
const fs = require('fs');

console.log = console.log.bind(console);
console.error = console.error.bind(console);

const logStream = fs.createWriteStream('backend.log', { flags: 'a' });
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  logStream.write(logMessage);
};

const app = express();

// enabling CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'authorization']
}));

// midware
app.use(express.json());
app.use('/api/auth', authRouter);

app.use('/uploads', express.static('uploads'));
app.use('/api/user' , passwordRoutes);

mongoose.connect('mongodb+srv://faizan-abbas-786:Abcd%40786@lms.1dl1hkq.mongodb.net/LMS', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  log('Connected to MongoDB');
}).catch(err => {
  log(`MongoDB connection error: ${err.message}`);
});

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  log(`Server error: ${err.message}\n${err.stack}`);
  res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
});



log('Starting server...');


app.get('/', (req, res) => {
  res.json({ success: true, message: 'Deployment working!' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});