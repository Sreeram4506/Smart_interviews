const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// ── MongoDB Connection ────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://sreerammulukuri6_db_user:8977012479@cluster0.oysurdz.mongodb.net/messpulse?appName=Cluster0';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    const demoUsers = [
      { username: 'studentdemo', password: 'student123', role: 'student', name: 'Asha Student' },
      { username: 'ownerdemo', password: 'owner123', role: 'mess_owner', name: 'Chef Rohan' },
    ];

    // Deterministic seeding for demo credentials:
    // - if user missing: create
    // - if user exists but password isn't bcrypt: set bcrypt-hashed password
    // Note: if user exists with some other bcrypt hash, we leave it unchanged to avoid overwriting real accounts.
    for (const userData of demoUsers) {
      const normalizedUsername = userData.username.toLowerCase();
      const existing = await User.findOne({ username: normalizedUsername });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await User.create({
          username: normalizedUsername,
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
        });
        console.log(`🌱 Seeded demo user: ${userData.username} (password=demo)`);
        continue;
      }

      // Force deterministic demo credentials on every startup
      existing.password = await bcrypt.hash(userData.password, 12);
      existing.role = userData.role;
      existing.name = userData.name;
      await existing.save();
      console.log(`🔐 Set deterministic demo password for: ${userData.username} (password=demo)`);
    }
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

 // ── Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auth', menuRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MessPulse AI API' });
});

// ── Socket.IO ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    socket.emit('joined-room', room);
  });

  socket.on('menu-update', (payload) => {
    io.emit('menu-update', payload);
  });

  socket.on('feedback-update', (payload) => {
    io.emit('feedback-update', payload);
  });

  socket.on('announcement', (payload) => {
    io.emit('announcement', payload);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`MessPulse server listening on ${PORT}`);
});
