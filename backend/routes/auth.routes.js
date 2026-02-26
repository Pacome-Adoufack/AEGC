import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import User from "../models/User.js";

const router = express.Router();

// Register - Inscription publique (crée un USER par défaut)
router.post("/register", async (req, res) => {
  const {
    name,
    firstName,
    email,
    gender,
    telefonNummer,
    country,
    city,
    university,
    password,
  } = req.body;

  if (
    !name ||
    !firstName ||
    !email ||
    !gender ||
    !telefonNummer ||
    !country ||
    !city ||
    !university ||
    !password
  ) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      firstName,
      email,
      gender,
      telefonNummer,
      country,
      city,
      university,
      password: hashedPassword,
      role: "user", // Par défaut
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: {
        name: user.name,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    // Inclure le rôle dans le token JWT
    const payload = {
      id: user._id,
      role: user.role || "user", // Compatibilité
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        email: user.email,
        country: user.country,
        city: user.city,
        telefonNummer: user.telefonNummer,
        gender: user.gender,
        university: user.university,
        role: user.role || "user",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "E-Mail requis" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = Date.now() + 1000 * 60 * 60 * 24; // 24h
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Initialiser Resend ici pour éviter les problèmes de chargement .env
    const resend = new Resend(process.env.RESEND_API);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL,
      to: user.email,
      subject: "Réinitialiser le mot de passe",
      html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #2d3e50; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">
              Réinitialiser le mot de passe
            </h1>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 20px;">
              Tu as demandé à ce que ton mot de passe soit réinitialisé. Veuillez cliquer sur le bouton ci-dessous pour réinitialiser votre mot de passe :
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/passwort-reset/${resetPasswordToken}"
                style="background-color: #4CAF50; color: white; padding: 14px 32px; text-decoration: none; font-size: 18px; font-weight: 600; border-radius: 8px; display: inline-block; transition: background-color 0.3s;">
                Réinitialiser le mot de passe
              </a>
            </div>
            <p style="color: #555555; font-size: 14px; line-height: 1.4; text-align: center;">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail. Votre mot de passe ne sera pas modifié.
            </p>
            <footer style="text-align: center; font-size: 12px; color: #999999; margin-top: 40px;">
              <p style="margin: 0;">© 2026 AEGC. Tous droits réservés.</p>
            </footer>
          </div>
        `,
    });
    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({
      data,
      message: "E-Mail de réinitialisation envoyé",
    });
  } catch (error) {
    console.error("Erreur de réinitialisation:", error);
    res.status(500).json({
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    });
  }
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Mot de passe requis" });
  }
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

// Vérifier la validité du token
router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }
    res.status(200).json({ message: "Token valide" });
  } catch (error) {
    console.error("Erreur:", error.message);
    res.status(500).json({ error: "Erreur serveur interne" });
  }
});

export default router;
