import dotenv from "dotenv";

// Charger les variables d'environnement dès l'import de ce module
dotenv.config();

// Exporter la configuration
export const config = {
  jwtSecret: process.env.JWT_SECRET_KEY,
  resendApi: process.env.RESEND_API,
  resendEmail: process.env.RESEND_EMAIL,
  mongodbUri: process.env.MONGODB_URI,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  notchpayPublicKey: process.env.NOTCHPAY_PUBLIC_KEY,
  notchpayPrivateKey: process.env.NOTCHPAY_PRIVATE_KEY,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  port: process.env.PORT || 3000,
};

// Log pour debug (à retirer en production)
if (!config.stripeSecretKey || config.stripeSecretKey === "sk_test_dummy") {
  console.warn("⚠️ STRIPE_SECRET_KEY non définie ou invalide");
} else {
  console.log("✅ Variables d'environnement chargées");
}
