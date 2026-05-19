import express from "express";
import Image from "../models/Picture.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Obtenir toutes les images (PUBLIC)
router.get("/images", async (req, res) => {
  try {
    const images = await Image.find();
    const result = images.map((image) => ({
      id: image._id,
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

// Ajouter une image (ADMIN/DEV)
router.post("/picture", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const { image, name, year } = req.body;
    if (!image) return res.status(400).json({ error: "Image requise" });

    const newPicture = new Image({ img: image, name, year });
    await newPicture.save();
    res.status(201).json({ message: "Image enregistrée avec succès!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

// Supprimer une image (ADMIN/DEV)
router.delete("/picture/:id", authMiddleware, requireRole(["admin", "dev"]), async (req, res) => {
  try {
    const picture = await Image.findByIdAndDelete(req.params.id);
    if (!picture) return res.status(404).json({ error: "Image non trouvée" });
    res.json({ message: "Image supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
