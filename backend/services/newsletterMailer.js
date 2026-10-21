import crypto from "crypto";
import { Resend } from "resend";
import User from "../models/User.js";
import Subscribe from "../models/Subscribe.js";
import { config } from "../config/env.js";

// Resend limite la taille d'un lot. On reste bien en dessous, et on envoie un
// message par personne : un envoi groupé exposerait les adresses des membres
// les unes aux autres.
const BATCH_SIZE = 20;
const BATCH_PAUSE_MS = 1100;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Destinataires : les membres qui ont explicitement accepté, plus les abonnés
 * de la lettre d'information, qui ont fait la démarche de s'inscrire.
 *
 * Les comptes sans réponse enregistrée (`newsletterOptIn: null`) sont
 * volontairement exclus : ils n'ont jamais été sollicités.
 */
export async function buildRecipients() {
  // Garde-fou de développement : si NEWSLETTER_TEST_RECIPIENT est renseigné,
  // TOUS les envois vont à cette seule adresse. La base de développement est
  // une copie de la production — elle contient de vraies adresses de membres,
  // qu'un essai ne doit jamais atteindre.
  const testRecipient = String(process.env.NEWSLETTER_TEST_RECIPIENT || "").trim();
  if (testRecipient) {
    console.warn(`[newsletter] MODE TEST : tout est envoyé à ${testRecipient}`);
    return [
      {
        email: testRecipient,
        prenom: "Test",
        token: "test-" + crypto.randomBytes(16).toString("hex"),
      },
    ];
  }

  const membres = await User.find({ newsletterOptIn: true })
    .select("email firstName newsletterToken")
    .lean();

  const abonnes = await Subscribe.find().select("email name unsubscribeToken").lean();

  // Les abonnés enregistrés avant cette fonctionnalité n'ont pas de jeton :
  // on leur en attribue un, sinon leur lien de désinscription serait vide.
  const sansJeton = abonnes.filter((a) => !a.unsubscribeToken);
  for (const a of sansJeton) {
    a.unsubscribeToken = crypto.randomBytes(24).toString("hex");
    await Subscribe.updateOne({ _id: a._id }, { $set: { unsubscribeToken: a.unsubscribeToken } });
  }

  const vus = new Set();
  const liste = [];

  for (const m of membres) {
    const email = String(m.email || "").trim().toLowerCase();
    if (!email || vus.has(email)) continue;
    vus.add(email);
    liste.push({ email, prenom: m.firstName || "", token: m.newsletterToken });
  }
  // Une même adresse peut être membre ET abonnée : elle ne reçoit qu'un envoi.
  for (const a of abonnes) {
    const email = String(a.email || "").trim().toLowerCase();
    if (!email || vus.has(email)) continue;
    vus.add(email);
    liste.push({ email, prenom: a.name || "", token: a.unsubscribeToken });
  }

  return liste;
}

function buildHtml(announcement, destinataire) {
  const site = config.frontendUrl.replace(/\/$/, "");
  const lien = `${site}/actualites`;
  const desinscription = `${site}/desinscription/${destinataire.token}`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin: 0 0 16px;">
      Association des Économistes et Gestionnaires du Cameroun
    </p>

    <h1 style="font-size: 21px; line-height: 1.35; color: #0f172a; margin: 0 0 14px;">
      ${escape(announcement.title)}
    </h1>

    <p style="font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      ${escape(announcement.summary)}
    </p>

    <p style="margin: 0 0 32px;">
      <a href="${lien}" style="background: #1a5fa6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Lire sur le site
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 16px;" />

    <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;">
      Vous recevez ce message parce que vous avez accepté de recevoir les actualités de l'AEGC.
      <br />
      <a href="${desinscription}" style="color: #64748b;">Se désinscrire en un clic</a>
    </p>
  </div>`;
}

/**
 * Envoie une annonce aux destinataires. Renvoie le compte des réussites et des
 * échecs — l'appelant les enregistre sur l'annonce.
 *
 * Ne lève jamais d'exception pour un destinataire : une adresse invalide ne
 * doit pas interrompre l'envoi aux autres.
 */
export async function sendAnnouncement(announcement, destinataires) {
  if (!config.resendApi) {
    throw new Error(
      "Aucune clé Resend configurée : l'envoi est désactivé. Renseignez RESEND_API dans backend/.env.",
    );
  }
  if (!process.env.RESEND_EMAIL) {
    throw new Error("Aucune adresse d'expédition configurée (RESEND_EMAIL).");
  }

  const resend = new Resend(config.resendApi);
  const site = config.frontendUrl.replace(/\/$/, "");
  let envoyes = 0;
  const erreurs = [];

  for (let i = 0; i < destinataires.length; i += BATCH_SIZE) {
    const lot = destinataires.slice(i, i + BATCH_SIZE);

    const resultats = await Promise.allSettled(
      lot.map((d) =>
        resend.emails.send({
          from: process.env.RESEND_EMAIL,
          to: d.email,
          subject: announcement.title,
          html: buildHtml(announcement, d),
          headers: {
            // Permet au client de messagerie d'afficher son propre bouton de
            // désinscription : c'est ce qui évite que les gens signalent le
            // message comme indésirable faute de trouver le lien.
            "List-Unsubscribe": `<${site}/desinscription/${d.token}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      ),
    );

    resultats.forEach((r, index) => {
      const email = lot[index].email;
      if (r.status === "fulfilled" && !r.value?.error) envoyes += 1;
      else erreurs.push({ email, raison: r.reason?.message || r.value?.error?.message || "échec" });
    });

    // Pause entre les lots : Resend limite le nombre d'envois par seconde.
    if (i + BATCH_SIZE < destinataires.length) await pause(BATCH_PAUSE_MS);
  }

  return { envoyes, erreurs };
}
