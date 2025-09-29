// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

// Core routes required for the whole application
const userRoutes = require('./routes/userRoutes');
const dataRoutes = require('./routes/dataRoutes');

// Consolidated Challenge Routes (Handles all challenge/gamification endpoints)
const challengeRoutes = require('./routes/challengeRoutes'); 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch((err) => console.error('MongoDB connection error:', err));


// Main Route
app.get('/', (req, res) => {
  res.send('Eco Pulse API is running...');
});

// User Routes (Authentication, Profiles, Admin Management)
app.use('/api/users', userRoutes);

// Data Routes (Electricity, Water, Waste usage input/history)
app.use('/api/data', dataRoutes);

// Challenge Routes (CRUD, Join, Leaderboard, Stats)
app.use('/api/challenges', challengeRoutes); 


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
