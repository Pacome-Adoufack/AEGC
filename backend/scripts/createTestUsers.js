import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script pour créer des utilisateurs de test
 * Mot de passe identique pour tous : Test123*
 */

const testUsers = [
  {
    name: "Nguyen",
    firstName: "Marie",
    email: "marie.nguyen@test.com",
    gender: "Female",
    telefonNummer: "+237670123456",
    country: "Cameroun",
    city: "Yaoundé",
    university: "Université de Yaoundé I",
    role: "user",
  },
  {
    name: "Kamga",
    firstName: "Jean",
    email: "jean.kamga@test.com",
    gender: "Male",
    telefonNummer: "+237680234567",
    country: "Cameroun",
    city: "Douala",
    university: "Université de Douala",
    role: "user",
  },
  {
    name: "Mbarga",
    firstName: "Sophie",
    email: "sophie.mbarga@test.com",
    gender: "Female",
    telefonNummer: "+237670345678",
    country: "Cameroun",
    city: "Bafoussam",
    university: "Université de Dschang",
    role: "user",
  },
  {
    name: "Essomba",
    firstName: "Paul",
    email: "paul.essomba@test.com",
    gender: "Male",
    telefonNummer: "+237680456789",
    country: "Cameroun",
    city: "Yaoundé",
    university: "Université de Yaoundé II",
    role: "user",
  },
  {
    name: "Atangana",
    firstName: "Alice",
    email: "alice.atangana@test.com",
    gender: "Female",
    telefonNummer: "+237670567890",
    country: "Cameroun",
    city: "Douala",
    university: "ESSEC Douala",
    role: "user",
  },
  {
    name: "Nkolo",
    firstName: "Thomas",
    email: "thomas.nkolo@test.com",
    gender: "Male",
    telefonNummer: "+237680678901",
    country: "Cameroun",
    city: "Bamenda",
    university: "University of Bamenda",
    role: "user",
  },
];

const createTestUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté\n");

    // Mot de passe identique pour tous les utilisateurs de test
    const hashedPassword = await bcrypt.hash("Test123*", 10);

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  ${userData.email} existe déjà - ignoré`);
        skippedCount++;
        continue;
      }

      // Créer l'utilisateur
      await User.create({
        ...userData,
        password: hashedPassword,
      });

      console.log(
        `✅ ${userData.firstName} ${userData.name} (${userData.email}) créé`,
      );
      createdCount++;
    }

    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Résumé:`);
    console.log(`   - ${createdCount} utilisateur(s) créé(s)`);
    console.log(`   - ${skippedCount} utilisateur(s) déjà existant(s)`);
    console.log("\n📧 Tous les utilisateurs utilisent le mot de passe:");
    console.log("🔑 Test123*");
    console.log("\n📋 Liste des emails:");
    testUsers.forEach((user) => {
      console.log(`   - ${user.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création des utilisateurs:", error);
    process.exit(1);
  }
};

// Exécuter le script
createTestUsers();
