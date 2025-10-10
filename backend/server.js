// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const dataRoutes = require('./routes/dataRoutes');
  
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

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);




// Challenge Routes (අලුතින් එකතු කළා)
app.use('/api/challenges', challengeRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});