import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    q1: {
      question: {
        type: String,
        // required: true,
        default: "La thématique était-elle pertinente ?",
      },
      answer: {
        type: String,
        enum: [
          "Très insatisfait",
          "Insatisfait",
          "Neutre",
          "Satisfait",
          "Très satisfait",
        ],
        // required: true,
      },
    },
    q2: {
      question: {
        type: String,
        // required: true,
        default: "Ce webinaire a-t-il répondu à vos attentes ?",
      },
      answer: {
        type: String,
        enum: ["Oui", "Non", "Neutre"],
        // required: true,
      },
    },
    q3: {
      question: {
        type: String,
        // required: true,
        default: "La présentation était-elle claire ?",
      },
      answer: {
        type: String,
        enum: [
          "Très insatisfait",
          "Insatisfait",
          "Neutre",
          "Satisfait",
          "Très satisfait",
        ],
        // required: true,
      },
    },
    q4: {
      question: {
        type: String,
        // required: true,
        default: "La durée du webinaire était-elle appropriée ?",
      },
      answer: {
        type: String,
        enum: ["Oui", "Non"],
        // required: true,
      },
    },
    q5: {
      question: {
        type: String,
        // required: true,
        default: "Qu'avez-vous le plus apprécié dans ce webinaire ?",
      },
      answer: { type: String, required: true },
    },
    q6: {
      question: {
        type: String,
        // required: true,
        default: "Avez-vous appris de nouvelles choses lors de ce webinaire ?",
      },
      answer: {
        type: String,
        enum: ["Oui", "Non"],
        // required: true,
      },
    },
    q7: {
      question: {
        type: String,
        // required: true,
        default:
          "Ce webinaire vous sera-t-il utile dans le cadre de votre travail ?",
      },
      answer: {
        type: String,
        enum: ["Oui", "Non", "Je ne sais pas"],
        // required: true,
      },
    },
    q8: {
      question: {
        type: String,
        // required: true,
        default: "Proposition d'amélioration",
      },
      answer: { type: String, required: true },
    },
    q9: {
      question: {
        type: String,
        // required: true,
        default: "Êtes-vous motivé pour participer au prochain webinaire ?",
      },
      answer: {
        type: String,
        enum: ["Oui", "Non", "Je ne sais pas"],
        // required: true,
      },
    },
    q10: {
      question: {
        type: String,
        // required: true,
        default:
          "Recommanderiez-vous les webinaires de l'AEGC à vos collègues ou ami(e)s ?",
      },
      answer: {
        type: String,
        enum: ["Oui", "Non", "Je ne sais pas"],
        // required: true,
      },
    },
    q11: {
      question: {
        type: String,
        // required: true,
        default:
          "Avez-vous reçu suffisamment d'informations sur l'AEGC, les panélistes et le contenu du webinaire avant le début de celui-ci ?",
      },
      answer: {
        type: String,
        enum: [
          "Totalement pas d'accord",
          "Pas d'accord",
          "Neutre",
          "D'accord",
          "Totalement d'accord",
        ],
        // required: true,
      },
    },
    q12: {
      question: {
        type: String,
        // required: true,
        default:
          "Avez-vous pu échanger avec les panélistes sur vos préoccupations ?",
      },
      answer: {
        type: String,
        enum: [
          "Totalement pas d'accord",
          "Pas d'accord",
          "Neutre",
          "D'accord",
          "Totalement d'accord",
        ],
        // required: true,
      },
    },
    q13: {
      question: {
        type: String,
        // required: true,
        default: "La qualité des intervenants était-elle satisfaisante ?",
      },
      answer: {
        type: String,
        enum: [
          "Très insatisfait",
          "Insatisfait",
          "Neutre",
          "Satisfait",
          "Très satisfait",
        ],
        // required: true,
      },
    },
    q14: {
      question: {
        type: String,
        // required: true,
        default: "Les supports de présentation étaient-ils clairs et utiles ?",
      },
      answer: {
        type: String,
        enum: [
          "Totalement pas d'accord",
          "Pas d'accord",
          "Neutre",
          "D'accord",
          "Totalement d'accord",
        ],
        // required: true,
      },
    },
    q15: {
      question: {
        type: String,
        // required: true,
        default: "Autres commentaires ou suggestions",
      },
      answer: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour améliorer les performances de recherche
faqSchema.index({ createdAt: -1 });

const Faq = mongoose.model("Faq", faqSchema);
export default Faq;
