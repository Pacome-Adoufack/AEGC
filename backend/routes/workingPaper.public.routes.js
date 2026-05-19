import express from "express";
import WorkingPaper from "../models/WorkingPaper.js";
import Submission from "../models/Submission.js";
import PublicationIssue from "../models/PublicationIssue.js";

const router = express.Router();

// Obtenir tous les WP ouverts (PUBLIC)
router.get("/working-papers", async (req, res) => {
  try {
    const workingPapers = await WorkingPaper.find()
      .populate("createdBy", "name firstName")
      .sort({ createdAt: -1 });

    const wpWithCounts = await Promise.all(
      workingPapers.map(async (wp) => {
        const count = await Submission.countDocuments({ workingPaper: wp._id });
        return { ...wp.toObject(), submissionsCount: count };
      }),
    );

    res.json(wpWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un WP spécifique (PUBLIC)
router.get("/working-papers/:id", async (req, res) => {
  try {
    const wp = await WorkingPaper.findById(req.params.id).populate("createdBy", "name firstName");

    if (!wp) return res.status(404).json({ error: "Working Paper non trouvé" });

    const count = await Submission.countDocuments({ workingPaper: wp._id });
    res.json({ ...wp.toObject(), submissionsCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historique public: publications de synthèse éditoriales
router.get("/working-papers/history/public", async (req, res) => {
  try {
    const publications = await PublicationIssue.find({ status: "published" })
      .select("title summary status publishedAt createdAt pdfFile stats")
      .sort({ publishedAt: -1, createdAt: -1 });

    const payload = publications.map((publication) => ({
      ...publication.toObject(),
      downloadUrl: `/api/publications/${publication._id}/download`,
    }));

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Télécharger une publication de synthèse (PUBLIC)
router.get("/publications/:id/download", async (req, res) => {
  try {
    const publication = await PublicationIssue.findById(req.params.id);

    if (!publication) return res.status(404).json({ error: "Publication non trouvée" });
    if (publication.status !== "published") return res.status(403).json({ error: "Publication non accessible" });

    res.download(publication.pdfFile.path, publication.pdfFile.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
