import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script pour créer le compte DEV initial
 * Email: dev@gmail.com
 * Password: dev*2026)
 * Role: dev
 */

const initDevAccount = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté");

    // Vérifier si le compte DEV existe déjà
    const existingDev = await User.findOne({ email: "dev@gmail.com" });

    if (existingDev) {
      console.log("⚠️  Le compte DEV existe déjà");

      // Si le compte existe mais n'a pas le rôle dev, on le met à jour
      if (existingDev.role !== "dev") {
        existingDev.role = "dev";
        await existingDev.save();
        console.log("✅ Rôle DEV mis à jour pour le compte existant");
      }

      process.exit(0);
    }

    // Créer le compte DEV
    const hashedPassword = await bcrypt.hash("dev*2026)", 10);

    const devUser = await User.create({
      name: "Developer",
      firstName: "System",
      email: "dev@gmail.com",
      gender: "Other",
      telefonNummer: "+000000000000",
      country: "System",
      city: "System",
      university: "System",
      password: hashedPassword,
      role: "dev",
    });

    console.log("✅ Compte DEV créé avec succès!");
    console.log("📧 Email: dev@gmail.com");
    console.log("🔑 Password: dev*2026)");
    console.log("👤 Role: dev");
    console.log(
      "\n🎉 Vous pouvez maintenant vous connecter avec ces identifiants",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création du compte DEV:", error);
    process.exit(1);
  }
};

// Exécuter le script
initDevAccount();
