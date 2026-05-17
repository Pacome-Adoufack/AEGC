import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI non trouvée dans .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find({}, {
      projection: {
        _id: 1,
        name: 1,
        firstName: 1,
        email: 1,
        role: 1,
        country: 1,
        city: 1,
        university: 1,
        telefonNummer: 1,
        gender: 1
      }
    }).toArray();

    console.log(`Nombre total d'utilisateurs: ${users.length}`);
    console.log(JSON.stringify(users, null, 2));

  } catch (err) {
    console.error('Erreur lors de la connexion ou de la requête:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
