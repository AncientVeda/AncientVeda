require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB-Verbindung erfolgreich!');
  } catch (error) {
    console.error('Fehler bei der Verbindung zu MongoDB:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();

