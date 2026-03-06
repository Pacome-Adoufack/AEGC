import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    workingPaper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkingPaper",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Métadonnées de l'article
    articleTitle: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    jelCodes: [
      {
        type: String,
        trim: true,
      },
    ],

    // Auteurs du travail (peut être plusieurs)
    authors: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        affiliation: {
          type: String,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    // Contenu
    abstract: {
      type: String,
      required: true,
    },

    // Si déjà publié ailleurs (optionnel)
    publication: {
      journal: {
        type: String,
        trim: true,
      },
      number: {
        type: String,
        trim: true,
      },
    },

    // Fichier PDF
    pdfFile: {
      filename: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
      },
      uploadDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Workflow
    status: {
      type: String,
      enum: ["reçue", "en_attente", "traitée", "terminée"],
      default: "reçue",
    },

    adminComments: [
      {
        comment: {
          type: String,
          required: true,
        },
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Visibilité dans l'historique public
    isPublicInHistory: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour empêcher double soumission
submissionSchema.index({ workingPaper: 1, submittedBy: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
