import mongoose from "mongoose";

const LEGACY_TO_NEW_SUBMISSION_STATUS = {
  reçue: "soumise",
  en_attente: "en_revision",
  traitée: "revision_requise",
  terminée: "acceptee",
};

const SUBMISSION_STATUSES = [
  "soumise",
  "en_revision",
  "revision_requise",
  "rejetee",
  "acceptee",
];

const REVIEW_REQUEST_STATUSES = ["open", "addressed"];

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

    // Historique des versions envoyées par l'auteur
    versions: [
      {
        versionNumber: {
          type: Number,
          required: true,
          min: 1,
        },
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
        responseNote: {
          type: String,
          trim: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        submittedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    currentVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Demandes de correction émises par l'admin
    reviewRequests: [
      {
        summary: {
          type: String,
          required: true,
          trim: true,
        },
        items: [
          {
            type: String,
            trim: true,
          },
        ],
        status: {
          type: String,
          enum: REVIEW_REQUEST_STATUSES,
          default: "open",
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        addressedAt: {
          type: Date,
        },
        addressedByVersion: {
          type: Number,
          min: 1,
        },
      },
    ],

    // Workflow
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: "soumise",
    },

    // Affectation editoriale (dispatcher)
    assignedDispatcher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dispatcherAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dispatcherAssignedAt: {
      type: Date,
      default: null,
    },
    dispatcherSessionClosedAt: {
      type: Date,
      default: null,
    },
    dispatcherSessionClosedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// Normalise automatiquement les anciens statuts vers le nouveau workflow.
submissionSchema.pre("validate", function normalizeLegacyStatus(next) {
  if (this.status && LEGACY_TO_NEW_SUBMISSION_STATUS[this.status]) {
    this.status = LEGACY_TO_NEW_SUBMISSION_STATUS[this.status];
  }

  if (!Array.isArray(this.versions)) {
    this.versions = [];
  }

  // Compatibilité: anciennes soumissions sans tableau de versions.
  if (
    this.versions.length === 0 &&
    this.pdfFile?.filename &&
    this.pdfFile?.path
  ) {
    this.versions.push({
      versionNumber: 1,
      pdfFile: {
        filename: this.pdfFile.filename,
        path: this.pdfFile.path,
        size: this.pdfFile.size,
        uploadDate: this.pdfFile.uploadDate || this.createdAt || new Date(),
      },
      submittedAt: this.createdAt || new Date(),
      submittedBy: this.submittedBy,
    });
  }

  if (this.versions.length > 0) {
    const highestVersion = this.versions.reduce(
      (max, version) => Math.max(max, version.versionNumber || 1),
      1,
    );
    this.currentVersion = highestVersion;
  } else if (!this.currentVersion || this.currentVersion < 1) {
    this.currentVersion = 1;
  }

  next();
});

// Index pour empêcher double soumission
submissionSchema.index({ workingPaper: 1, submittedBy: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
