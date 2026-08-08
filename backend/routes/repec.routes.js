import express from "express";
import path from "path";
import fs from "fs";
import Submission from "../models/Submission.js";

const router = express.Router();

const ARCHIVE_CODE = "cxy";
const BASE_URL = "https://aegc-web.com";
const MAINTAINER_EMAIL = "aegc.237@gmail.com";

// Formate un texte multi-ligne en ReDIF (lignes de continuation avec espace)
function rediLines(text, indent = " ") {
  if (!text) return "";
  return text
    .replace(/\r?\n/g, `\n${indent}`)
    .trim();
}

// Formate une date en yyyy ou yyyy-mm
function rediDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// Charge les soumissions acceptées et publiques, triées par date de création
async function getAcceptedSubmissions() {
  return Submission.find({ status: "acceptee", isPublicInHistory: true })
    .populate("workingPaper", "title language")
    .populate("submittedBy", "name firstName email")
    .sort({ createdAt: 1 });
}

// ─────────────────────────────────────────────
// GET /repec/cxy/cxyarch.rdf  — Archive metadata
// ─────────────────────────────────────────────
router.get(`/repec/${ARCHIVE_CODE}/${ARCHIVE_CODE}arch.rdf`, (req, res) => {
  const content = `Template-Type: ReDIF-Archive 1.0
Handle: RePEc:${ARCHIVE_CODE}
Name: Association des Economistes et Gestionnaires du Cameroun
Maintainer-Email: ${MAINTAINER_EMAIL}
URL: ${BASE_URL}/repec/${ARCHIVE_CODE}/
Description: This archive collects working papers submitted to and
 accepted by the AEGC (Association des Economistes et Gestionnaires
 du Cameroun), an independent academic association founded in 2021
 that promotes scientific research in economics, management and
 public policy in Cameroon.
`;

  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(content);
});

// ─────────────────────────────────────────────
// GET /repec/cxy/wpaper/seri.rdf  — Series metadata
// ─────────────────────────────────────────────
router.get(`/repec/${ARCHIVE_CODE}/wpaper/seri.rdf`, (req, res) => {
  const content = `Template-Type: ReDIF-Series 1.0
Name: AEGC Working Papers
Handle: RePEc:${ARCHIVE_CODE}:wpaper
Maintainer-Email: ${MAINTAINER_EMAIL}
Maintainer-Name: AEGC Editorial Team
Type: ReDIF-Paper
Provider-Name: Association des Economistes et Gestionnaires du Cameroun
Provider-Homepage: ${BASE_URL}
Description: Working papers series of the AEGC covering economics,
 management and public policy research with a focus on Cameroon
 and sub-Saharan Africa.
`;

  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(content);
});

// ─────────────────────────────────────────────
// GET /repec/cxy/wpaper/wpaper.rdf  — All accepted papers
// ─────────────────────────────────────────────
router.get(`/repec/${ARCHIVE_CODE}/wpaper/wpaper.rdf`, async (req, res) => {
  try {
    const submissions = await getAcceptedSubmissions();

    if (submissions.length === 0) {
      res.set("Content-Type", "text/plain; charset=utf-8");
      return res.send("# No published working papers yet\n");
    }

    const blocks = submissions.map((sub, index) => {
      const num = String(index + 1).padStart(3, "0");
      const handle = `RePEc:${ARCHIVE_CODE}:wpaper:${num}`;
      const pdfUrl = `${BASE_URL}/repec/submissions/${sub._id}/pdf`;

      const authorLines = (sub.authors || []).map((a) => {
        const lines = [`Author-Name: ${a.name}`];
        if (a.email) lines.push(`Author-Email: ${a.email}`);
        if (a.affiliation) lines.push(`Author-Workplace-Name: ${a.affiliation}`);
        return lines.join("\n");
      }).join("\n");

      const jelLine = sub.jelCodes?.length
        ? `Classification-JEL: ${sub.jelCodes.join("; ")}`
        : "";

      const keywordsLine = sub.keywords?.length
        ? `Keywords: ${sub.keywords.join("; ")}`
        : "";

      const langLine = sub.workingPaper?.language === "anglais" ? "Language: en" : "Language: fr";

      const parts = [
        `Template-Type: ReDIF-Paper 1.0`,
        authorLines,
        `Title: ${sub.articleTitle}`,
        sub.abstract ? `Abstract: ${rediLines(sub.abstract)}` : "",
        `Creation-Date: ${rediDate(sub.createdAt)}`,
        jelLine,
        keywordsLine,
        langLine,
        `File-URL: ${pdfUrl}`,
        `File-Format: Application/PDF`,
        `Handle: ${handle}`,
      ].filter(Boolean);

      return parts.join("\n");
    });

    const body = blocks.join("\n\n") + "\n";

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(body);
  } catch (err) {
    console.error("RePEC wpaper.rdf error:", err);
    res.status(500).send("# Internal error\n");
  }
});

// ─────────────────────────────────────────────
// GET /repec/submissions/:id/pdf  — PDF public pour les papiers acceptés
// ─────────────────────────────────────────────
router.get("/repec/submissions/:id/pdf", async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).select("status isPublicInHistory pdfFile versions");

    if (!sub) return res.status(404).send("Not found");
    if (sub.status !== "acceptee" || !sub.isPublicInHistory) {
      return res.status(403).send("Forbidden");
    }

    // Utiliser la dernière version si disponible, sinon le fichier principal
    const lastVersion = sub.versions?.at(-1);
    const pdfPath = lastVersion?.pdfFile?.path || sub.pdfFile?.path;
    const pdfFilename = lastVersion?.pdfFile?.filename || sub.pdfFile?.filename;

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return res.status(404).send("PDF not found");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdfFilename}"`);
    res.sendFile(path.resolve(pdfPath));
  } catch (err) {
    console.error("RePEC PDF download error:", err);
    res.status(500).send("Internal error");
  }
});

export default router;
