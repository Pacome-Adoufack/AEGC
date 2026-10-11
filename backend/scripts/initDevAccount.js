/**
 * Crée ou réinitialise un compte de travail dans la base de DÉVELOPPEMENT.
 *
 *   npm run init-dev                 -> compte dev@gmail.com, rôle dev
 *   npm run init-dev -- a@b.com admin
 *
 * Le mot de passe est tiré au hasard et écrit dans docs/DEV_CREDENTIALS.md
 * (ignoré par Git), jamais affiché dans le terminal : un terminal se partage
 * en capture d'écran, pas un fichier local.
 *
 * Garde-fou : le script refuse de s'exécuter si la base visée n'est pas une
 * base de développement. Impossible de réinitialiser un compte de production
 * par distraction.
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "../config/env.js";
import User from "../models/User.js";

const DEV_DB_PATTERN = /\/(aegc_dev|aegc_test)(\?|$)/;
const CREDENTIALS_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "docs",
  "DEV_CREDENTIALS.md",
);

const VALID_ROLES = ["user", "admin", "dev", "dispatcher"];

function generatePassword() {
  // 18 caractères issus d'une source cryptographique, plus les classes exigées
  // par la validation du formulaire d'inscription.
  return `Dev-${crypto.randomBytes(12).toString("base64url").slice(0, 14)}!7`;
}

function writeCredentials(email, password, role) {
  const content = `# Comptes de test — base de développement uniquement

Ce fichier est ignoré par Git. Il ne contient que des comptes de la base de
développement, jamais des identifiants de production.

Régénérer : \`npm run init-dev\` (ou \`npm.cmd run init-dev\` sous PowerShell).

## Compte de travail

- Adresse : \`${email}\`
- Mot de passe : \`${password}\`
- Rôle : \`${role}\`
- Réinitialisé le : ${new Date().toLocaleString("fr-FR")}

## Rappel

\`backend/.env\` doit viser la base de développement pendant le travail, et la
ligne PROD avant de construire une image pour le déploiement.
`;
  fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
  fs.writeFileSync(CREDENTIALS_FILE, content);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI absent de backend/.env");
    process.exit(1);
  }
  if (!DEV_DB_PATTERN.test(uri)) {
    console.error("REFUS : la base visée n'est pas une base de développement.");
    console.error("Activez la ligne DEV dans backend/.env avant de relancer.");
    process.exit(1);
  }

  const email = (process.argv[2] || "dev@gmail.com").trim().toLowerCase();
  const role = VALID_ROLES.includes(process.argv[3]) ? process.argv[3] : "dev";
  const password = generatePassword();

  await mongoose.connect(uri);
  console.log(`Base : ${mongoose.connection.name}`);

  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = hashed;
    existing.role = role;
    await existing.save();
    console.log(`Compte existant mis à jour : ${email} (rôle ${role})`);
  } else {
    await User.create({
      name: "Dev",
      firstName: "Compte",
      email,
      gender: "Other",
      telefonNummer: "0000000000",
      country: "Cameroun",
      city: "Yaoundé",
      university: "AEGC",
      password: hashed,
      role,
    });
    console.log(`Compte créé : ${email} (rôle ${role})`);
  }

  writeCredentials(email, password, role);
  console.log("Mot de passe écrit dans docs/DEV_CREDENTIALS.md");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Échec :", error.message);
  process.exit(1);
});
