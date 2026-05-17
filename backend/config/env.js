import dotenv from "dotenv";

// Charger les variables d'environnement dès l'import de ce module
dotenv.config();

// Exporter la configuration
export const config = {
  jwtSecret: process.env.JWT_SECRET_KEY,
  resendApi: process.env.RESEND_API,
  resendEmail: process.env.RESEND_EMAIL,
  mongodbUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  port: process.env.PORT || 3000,
  pdfMaxSizeMb: Number(process.env.PDF_MAX_SIZE_MB) || 10,
  // Informations de paiement manuel (à afficher côté frontend)
  paymentIban: process.env.PAYMENT_INFO_IBAN || null,
  paymentBankAccount: process.env.PAYMENT_INFO_BANK_ACCOUNT || null,
  paymentOrangeNumber: process.env.PAYMENT_INFO_ORANGE || null,
  paymentMtnNumber: process.env.PAYMENT_INFO_MTN || null,
  adminEmail: process.env.ADMIN_EMAIL || process.env.RESEND_EMAIL || null,
};
