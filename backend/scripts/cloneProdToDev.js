/**
 * Recopie la base de PRODUCTION dans la base de DÉVELOPPEMENT.
 *
 *   npm run clone-prod
 *
 * Pourquoi : travailler sur des données réalistes, et surtout retrouver ses
 * propres identifiants — les empreintes de mots de passe sont copiées telles
 * quelles, donc les comptes fonctionnent avec leur mot de passe du moment.
 *
 * Trois garde-fous, parce qu'une inversion source/cible écraserait le site :
 *   1. la SOURCE est lue depuis .env.prod-backup, jamais depuis .env ;
 *   2. la CIBLE doit être une base de développement (nom aegc_dev/aegc_test) ;
 *   3. source et cible doivent être différentes.
 *
 * La connexion de production n'est ouverte qu'en lecture : aucune écriture
 * n'est jamais émise vers elle.
 */
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "../config/env.js";

const BACKEND_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROD_FILE = path.join(BACKEND_DIR, ".env.prod-backup");
const DEV_DB_PATTERN = /\/(aegc_dev|aegc_test)(\?|$)/;

function readProdUri() {
  if (!fs.existsSync(PROD_FILE)) {
    throw new Error(".env.prod-backup introuvable : impossible de savoir quelle base copier");
  }
  const line = fs
    .readFileSync(PROD_FILE, "utf8")
    .split(/\r?\n/)
    .find((l) => /^MONGODB_URI=/.test(l));
  if (!line) throw new Error("Aucune ligne MONGODB_URI active dans .env.prod-backup");
  return line.slice("MONGODB_URI=".length).trim();
}

const dbNameOf = (uri) => (uri.match(/mongodb\.net\/([^?]+)/) || [])[1] || "?";

async function main() {
  const devUri = process.env.MONGODB_URI;
  const prodUri = readProdUri();

  if (!DEV_DB_PATTERN.test(devUri)) {
    console.error("REFUS : la base visée par backend/.env n'est pas une base de développement.");
    console.error("Activez la ligne DEV avant de relancer.");
    process.exit(1);
  }
  if (dbNameOf(devUri) === dbNameOf(prodUri) && devUri === prodUri) {
    console.error("REFUS : la source et la cible sont identiques.");
    process.exit(1);
  }

  console.log(`Source (lecture seule) : ${dbNameOf(prodUri)}`);
  console.log(`Cible  (sera écrasée)  : ${dbNameOf(devUri)}`);

  const prod = await mongoose.createConnection(prodUri).asPromise();
  const dev = await mongoose.createConnection(devUri).asPromise();

  const collections = (await prod.db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  let total = 0;
  for (const name of collections) {
    const docs = await prod.db.collection(name).find({}).toArray();
    await dev.db.collection(name).deleteMany({});
    if (docs.length) await dev.db.collection(name).insertMany(docs);
    total += docs.length;
    console.log(`  ${name.padEnd(24)} ${docs.length}`);
  }

  console.log(`\n${collections.length} collections, ${total} documents copiés.`);
  console.log("Les mots de passe de production fonctionnent désormais en développement.");
  console.log("Rappel : cette base contient de vraies données personnelles.");

  await prod.close();
  await dev.close();
}

main().catch((error) => {
  console.error("Échec :", error.message);
  process.exit(1);
});
