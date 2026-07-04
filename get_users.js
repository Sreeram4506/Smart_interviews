const mongoose = require('mongoose');
const User = require('./server/models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sreerammulukuri6_db_user:8977012479@cluster0.oysurdz.mongodb.net/messpulse?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Found users:');
      users.forEach(user => {
        console.log(`- Name: ${user.name}, Username: ${user.username}, Role: ${user.role}`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
