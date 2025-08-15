const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection (fill in your real username and password)
mongoose.connect('mongodb+srv://pgod8520:<jlLczhHdriHNbiM6>@cluster0.6uyg6xu.mongodb.net/vegavip?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Mongoose user schema/model
const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },
  uid:   { type: String, unique: true, required: true },
  password: { type: String, required: true },
  invite: { type: String }
});
const User = mongoose.model('User', userSchema);

// UID generator
function generateUID() {
  return "VEGA" + Math.floor(1000000 + Math.random()*9000000);
}

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { phone, password, invite } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required.' });
  try {
    const existing = await User.findOne({ phone });
    if (existing) return res.status(409).json({ error: 'Phone already registered.' });
    let userUID = generateUID();
    // Ensure UID unique
    while (await User.findOne({ uid: userUID })) userUID = generateUID();
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ phone, uid: userUID, password: hash, invite });
    await user.save();
    res.json({ success: true, uid: userUID });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login with phone/password
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
    res.json({ success: true, uid: user.uid });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Login with UID/password
app.post('/api/login-uid', async (req, res) => {
  const { uid, password } = req.body;
  try {
    const user = await User.findOne({ uid });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
    res.json({ success: true, uid: user.uid, phone: user.phone });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Reset password (by phone)
app.post('/api/reset', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'Phone not found.' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Reset failed.' });
  }
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
app.get('/', (req, res) => {
  res.send('VEGA VIP backend running!');
});
