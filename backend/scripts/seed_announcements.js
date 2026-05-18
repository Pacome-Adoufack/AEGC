import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "../config/env.js";
import Announcement from "../models/Announcement.js";
import User from "../models/User.js";

async function main() {
  if (!config.mongodbUri) {
    console.error(
      "MONGODB_URI not set in environment (see backend/config/env.js)",
    );
    process.exit(1);
  }

  await mongoose.connect(config.mongodbUri);
  console.log("Connected to MongoDB");

  // Ensure there is an admin user to assign as author
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    const password = "ChangeMe123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const adminData = {
      name: "Admin",
      firstName: "AEGC",
      email: config.adminEmail || "admin@aegc.local",
      gender: "M",
      telefonNummer: "0000000000",
      country: "CM",
      city: "Yaoundé",
      university: "AEGC",
      password: hash,
      role: "admin",
    };

    admin = new User(adminData);
    await admin.save();
    console.log("Admin user created:", admin.email, "(password: ChangeMe123!)");
  } else {
    console.log("Found existing admin:", admin.email);
  }

  const now = new Date();
  const announcements = [
    {
      title: "Lancement du Comité de Recherche AEGC",
      summary:
        "Le comité de recherche AEGC se réunit pour définir le plan d'action 2026-2027.",
      content:
        "<p>Le comité de recherche de l'AEGC lance un cycle de réunions pour coordonner les travaux scientifiques. Participation ouverte aux membres.</p>",
      category: "ANNOUNCEMENT",
      isPublished: true,
      publishedAt: now,
      expiresAt: null,
      isPinned: true,
    },
    {
      title: "Appel à communications — Conférence AEGC 2026",
      summary:
        "Soumettez vos communications pour la conférence annuelle avant le 30 septembre.",
      content:
        "<p>La conférence annuelle accueillera des présentations sur l'économie, la gestion et l'innovation.</p>",
      category: "EVENT",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      expiresAt: null,
      isPinned: false,
    },
    {
      title: "Publication du bulletin trimestriel",
      summary: "Le bulletin Q1 est disponible en téléchargement sur le site.",
      content:
        "<p>Téléchargez le bulletin pour retrouver les articles et analyses des membres.</p>",
      category: "INFO",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      expiresAt: null,
      isPinned: false,
    },
    {
      title: "Programme des formations 2026",
      summary:
        "Découvrez le calendrier des formations professionnelles pour 2026.",
      content:
        "<p>Formations courtes et spécialisées en économie et gestion. Inscriptions ouvertes.</p>",
      category: "INFO",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 12 * 24 * 3600 * 1000),
      expiresAt: null,
      isPinned: false,
    },
    {
      title: "Partenariat AEGC - Université Locale",
      summary:
        "Un nouveau partenariat pour renforcer la recherche et les échanges académiques.",
      content:
        "<p>L'AEGC signe un accord-cadre avec l'université locale pour des projets communs.</p>",
      category: "ANNOUNCEMENT",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 20 * 24 * 3600 * 1000),
      expiresAt: null,
      isPinned: false,
    },
  ];

  let created = 0;
  for (const a of announcements) {
    const exists = await Announcement.findOne({ title: a.title });
    if (exists) {
      console.log("Skipping existing announcement:", a.title);
      continue;
    }

    const doc = new Announcement({ ...a, author: admin._id });
    await doc.save();
    console.log("Created announcement:", a.title);
    created++;
  }

  console.log(`Done. ${created} announcements created.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed script error:", err);
  process.exit(1);
});
