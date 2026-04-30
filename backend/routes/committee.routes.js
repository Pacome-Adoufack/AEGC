import express from "express";
import CommitteeMember from "../models/CommitteeMember.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import requireRole from "../middlewares/roleMiddleware.js";

const router = express.Router();

const parseDisplayOrder = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const committeeSort = (memberA, memberB) => {
  const orderA = Number(memberA.displayOrder || 0);
  const orderB = Number(memberB.displayOrder || 0);

  if (orderA === 0 && orderB !== 0) return 1;
  if (orderA !== 0 && orderB === 0) return -1;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(memberA.fullName || "").localeCompare(
    String(memberB.fullName || ""),
    "fr",
    {
      sensitivity: "base",
    },
  );
};

// Liste publique des membres actifs du comité scientifique
router.get("/committee-members", async (req, res) => {
  try {
    const members = await CommitteeMember.find({ isActive: true }).lean();

    members.sort(committeeSort);

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Liste complète pour édition (DEV/ADMIN)
router.get(
  "/admin/committee-members",
  authMiddleware,
  requireRole(["dev", "admin"]),
  async (req, res) => {
    try {
      const members = await CommitteeMember.find().lean();

      members.sort(committeeSort);

      res.json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Créer un membre (DEV/ADMIN)
router.post(
  "/admin/committee-members",
  authMiddleware,
  requireRole(["dev", "admin"]),
  async (req, res) => {
    try {
      const {
        fullName,
        roleTitle,
        affiliation,
        email,
        profileLink,
        displayOrder,
        isActive,
      } = req.body;

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ error: "Le nom complet est requis" });
      }

      const member = await CommitteeMember.create({
        fullName: fullName.trim(),
        roleTitle: roleTitle || "",
        affiliation: affiliation || "",
        email: email || "",
        profileLink: profileLink || "",
        displayOrder: parseDisplayOrder(displayOrder),
        isActive: isActive !== false,
      });

      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Modifier un membre (DEV/ADMIN)
router.put(
  "/admin/committee-members/:id",
  authMiddleware,
  requireRole(["dev", "admin"]),
  async (req, res) => {
    try {
      const {
        fullName,
        roleTitle,
        affiliation,
        email,
        profileLink,
        displayOrder,
        isActive,
      } = req.body;

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ error: "Le nom complet est requis" });
      }

      const updated = await CommitteeMember.findByIdAndUpdate(
        req.params.id,
        {
          fullName: fullName.trim(),
          roleTitle: roleTitle || "",
          affiliation: affiliation || "",
          email: email || "",
          profileLink: profileLink || "",
          displayOrder: parseDisplayOrder(displayOrder),
          isActive: isActive !== false,
        },
        { new: true, runValidators: true },
      );

      if (!updated) {
        return res.status(404).json({ error: "Membre non trouvé" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Supprimer un membre (DEV/ADMIN)
router.delete(
  "/admin/committee-members/:id",
  authMiddleware,
  requireRole(["dev", "admin"]),
  async (req, res) => {
    try {
      const deleted = await CommitteeMember.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Membre non trouvé" });
      }

      res.json({ message: "Membre supprimé" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
