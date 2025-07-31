import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Image from "../models/Picture.js";

// __dirname workaround pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement, maintenant que __dirname est défini
dotenv.config({ path: path.join(__dirname, "../.env") });

async function insertImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");

    // Vérification ou création de la collection "test"
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes("test")) {
      await db.createCollection("test");
      await db.collection("test").insertOne({ message: "Initial document" });
      console.log("📁 'test' collection created with initial document");
    }

    // Chemin vers le dossier contenant les images
    const directoryPath = path.join(__dirname, "../images");
    const files = fs.readdirSync(directoryPath);

    for (let file of files) {
      const filePath = path.join(directoryPath, file);
      const imgData = fs.readFileSync(filePath);
      const extension = path.extname(file).substring(1); // "jpg", "png"

      const image = new Image({
        name: file,
        img: {
          data: imgData,
          contentType: `image/${extension}`,
        },
        year: 2025, // ou une autre logique pour définir l'année
      });

      await image.save();
      console.log(`📸 Image "${file}" inserted successfully.`);
    }
  } catch (err) {
    console.error("❌ Error inserting images:", err);
  } finally {
    mongoose.disconnect();
  }
}

insertImages();
