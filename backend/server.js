import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Activity from "./models/Activity.js";
import User from "./models/User.js";
import Faq from "./models/Faq.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();
import Contact from "./models/Contact.js";
import Reservation from "./models/Reservation.js";
import Subscribe from "./models/Subscribe.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import Image from "./models/Picture.js";
import multer from "multer";
import upload from "./middlewares/upload.js";

const app = express();
app.use(cors());
app.use(express.json());


const resend = new Resend(process.env.RESEND_API);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    // Création d'une collection test si elle n'existe pas
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes("test")) {
      await db.createCollection("test");
      await db.collection("test").insertOne({ message: "Initial document" });
      console.log("Test collection created with initial document");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

app.post("/register", async (req, res) => {
  const {
    name,
    firstName,
    email,
    gender,
    telefonNummer,
    country,
    city,
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
    !password
  ) {
    return res.status(400).json({ error: "Invalid registration" });
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
      password: hashedPassword,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Invalid login" });
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);

    res.json({ user: user, token: token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/activities", async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/activities", async (req, res) => {
  try {
    const { name, description, image, date, location, presenter } = req.body;

    const activity = new Activity({
      name,
      description,
      image,
      date,
      location,
      presenter,
    });

    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    console.log("E-Mail erhalten:", email);
    return res.status(400).json({ error: "E-Mail ist erforderlich." });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden." });
    }
    console.log(user);
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = Date.now() + 1000 * 60 * 60 * 24; // Token gültig für 24 Stunden
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();
    console.log("Token gespeichert:", user.resetPasswordToken);

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
              <p style="margin: 0;">© 2025 AEGC. Tous droits réservés.</p>
            </footer>
          </div>
        `,
    });
    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({
      data,
      message: "E-Mail zum Zurücksetzen des Passworts wurde gesendet.",
    });
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    res.status(500).json({
      error:
        "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    });
  }
});
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Passwort ist erforderlich." });
  }
  try {
    // Überprüfen, ob der Token existiert und nicht abgelaufen ist
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token muss noch gültig sein
    });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Ungültiger oder abgelaufener Token." });
    }
    // Neues Passwort setzen
    user.password = await bcrypt.hash(password, 10); // Passwort-Hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Passwort erfolgreich zurückgesetzt." });
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});
app.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token muss gültig sein
    });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Ungültiger oder abgelaufener Token." });
    }
    res.status(200).json({ message: "Token ist gültig" });
  } catch (error) {
    console.error("Error in getResetPasswordPage:", error.message);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});
// app.get('/api/newspapers', async (req, res) => {
//     try {
//         const newspapers = await Newspaper.find();
//         res.json(newspapers);
//     } catch (err) {
//         console.error('Error fetching newspapers:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

app.post("/contact", async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich." });
    }

    const newContact = new Contact({
      email,
      subject,
      message,
    });

    await newContact.save();

    res.status(201).json({ message: "Nachricht erfolgreich gesendet!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Es gab einen Fehler beim Senden der Nachricht." });
  }
});

app.post("/reservation", authMiddleware, async (req, res) => {
  try {
    console.log("Données reçues :", req.body);
    const {
      firstname,
      lastname,
      email,
      phone,
      gender,
      profession,
      activityId,
    } = req.body;
    const user = req.user.id;
    console.log("User ID :", user);

    if (
      !user ||
      !firstname ||
      !lastname ||
      !email ||
      !phone ||
      !gender ||
      !profession ||
      !activityId
    ) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich." });
    }

    const newReservation = new Reservation({
      user,
      firstname,
      lastname,
      email,
      phone,
      gender,
      profession,
      activity: activityId,
    });

    await newReservation.save();

    res.status(201).json({ message: "Réservation réussie !" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la réservation." });
  }
});

// Assure-toi que ton middleware d'authentification ajoute req.user
app.get("/reservation", authMiddleware, async (req, res) => {
  try {
    console.log("Requête utilisateur :", req.user);
    const reservations = await Reservation.find({ user: req.user.id }).populate(
      "activity"
    );
    res.json(reservations);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations." });
  }
});

app.get("/reservation/:activityId", async (req, res) => {
  try {
    const reservations = await Reservation.find({
      activity: req.params.activityId,
    }).populate("activity");
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération." });
  }
});
app.delete("/reservation/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée." });
    }
    res.json({ message: "Réservation annulée avec succès." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erreur lors de l'annulation de la réservation." });
  }
});
app.post("/subscribe", async (req, res) => {
  try {
    const { email, name, lastName } = req.body;

    if (!email || !name || !lastName) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich." });
    }

    const newSubscribe = new Subscribe({
      email,
      name,
      lastName,
    });

    await newSubscribe.save();

    res.status(201).json({ message: "enregistrement reuissie!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de lenregistrement." });
  }
});

app.post("/picture", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich." });
    }

    const newPicture = new Picture({
      image,
    });

    await newPicture.save();

    res.status(201).json({ message: "enregistrement reuissie!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de lenregistrement." });
  }
});
app.get("picture", async (req, res) => {
  try {
    const picture = await Picture.find();
    res.json(picture);
  } catch (err) {
    console.error("Error fetching pictures:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/faq", async (req, res) => {
  try {
    const faqData = req.body;

    if (!faqData || Object.keys(faqData).length === 0) {
      return res.status(400).json({ error: "Invalid FAQ data" });
    }

    // Validation des données avant sauvegarde
    const requiredQuestions = [
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
      "q9",
      "q10",
      "q11",
      "q12",
      "q13",
      "q14",
      "q15",
    ];

    for (const q of requiredQuestions) {
      if (!faqData[q] || !faqData[q].question || !faqData[q].answer) {
        return res.status(400).json({ error: `Missing data for ${q}` });
      }
    }

    const faq = new Faq(faqData);
    await faq.save();

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Error creating FAQ:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
app.get("/faq", async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});
app.get("/images", async (req, res) => {
  try {
    const images = await Image.find();
    const result = images.map((image) => ({
      name: image.name,
      contentType: image.img.contentType,
      year: image.year,
      img: `data:${image.img.contentType};base64,${image.img.data.toString("base64")}`,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on http://0.0.0.0:3000");
});
