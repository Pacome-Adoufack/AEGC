import React, { useState } from "react";
import { API_BASE_URL } from "../Url";
import "../../styles/Faq.css";
import { useTranslation } from "react-i18next";

const Faq = () => {
  const { t } = useTranslation();
  // Définition complète des questions
  const questions = [
    {
      id: "q1",
      text: "La thématique était-elle pertinente ?",
      type: "select",
      options: ["Très insatisfait", "Insatisfait", "Neutre", "Satisfait", "Très satisfait"],
    },
    {
      id: "q2",
      text: "Ce webinaire a-t-il répondu à vos attentes ?",
      type: "radio",
      options: ["Oui", "Non", "Neutre"],
    },
    {
      id: "q3",
      text: "La présentation était-elle claire ?",
      type: "select",
      options: ["Très insatisfait", "Insatisfait", "Neutre", "Satisfait", "Très satisfait"],
    },
    {
      id: "q4",
      text: "La durée du webinaire était-elle appropriée ?",
      type: "radio",
      options: ["Oui", "Non"],
    },
    {
      id: "q5",
      text: "Qu'avez-vous le plus apprécié dans ce webinaire ?",
      type: "textarea",
    },
    {
      id: "q6",
      text: "Avez-vous appris de nouvelles choses lors de ce webinaire ?",
      type: "radio",
      options: ["Oui", "Non"],
    },
    {
      id: "q7",
      text: "Ce webinaire vous sera-t-il utile dans le cadre de votre travail ?",
      type: "radio",
      options: ["Oui", "Non", "Je ne sais pas"],
    },
    {
      id: "q8",
      text: "Proposition d'amélioration",
      type: "textarea",
    },
    {
      id: "q9",
      text: "Êtes-vous motivé pour participer au prochain webinaire ?",
      type: "radio",
      options: ["Oui", "Non", "Je ne sais pas"],
    },
    {
      id: "q10",
      text: "Recommanderiez-vous les webinaires de l'AEGC à vos collègues ou ami(e)s ?",
      type: "radio",
      options: ["Oui", "Non", "Je ne sais pas"],
    },
    {
      id: "q11",
      text: "Avez-vous reçu suffisamment d'informations sur l'AEGC, les panélistes et le contenu du webinaire avant le début de celui-ci ?",
      type: "radio",
      options: ["Totalement pas d'accord", "Pas d'accord", "Neutre", "D'accord", "Totalement d'accord"],
    },
    {
      id: "q12",
      text: "Avez-vous pu échanger avec les panélistes sur vos préoccupations ?",
      type: "radio",
      options: ["Totalement pas d'accord", "Pas d'accord", "Neutre", "D'accord", "Totalement d'accord"],
    },
    {
      id: "q13",
      text: "La qualité des intervenants était-elle satisfaisante ?",
      type: "select",
      options: ["Très insatisfait", "Insatisfait", "Neutre", "Satisfait", "Très satisfait"],
    },
    {
      id: "q14",
      text: "Les supports de présentation étaient-ils clairs et utiles ?",
      type: "radio",
      options: ["Totalement pas d'accord", "Pas d'accord", "Neutre", "D'accord", "Totalement d'accord"],
    },
    {
      id: "q15",
      text: "Autres commentaires ou suggestions",
      type: "textarea",
    }
  ];

  // État initial des réponses
  const initialResponses = questions.reduce((acc, question) => {
    acc[question.id] = "";
    return acc;
  }, {});

  const [responses, setResponses] = useState(initialResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    message: "",
  });

  // Gestion des changements de réponse
  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ success: false, message: "" });

    try {
      // Vérification que toutes les réponses sont remplies
      const unansweredQuestions = questions.filter(q => !responses[q.id]);
      if (unansweredQuestions.length > 0) {
        throw new Error(t("faq.requiredQuestion", { question: t(`faq.questions.${unansweredQuestions[0].id}`) }));
      }

      // Préparation des données pour l'API
      const submissionData = {};
      questions.forEach(question => {
        submissionData[question.id] = {
          question: question.text,
          answer: responses[question.id]
        };
      });

      // Envoi avec fetch
      const response = await fetch(`${API_BASE_URL}/faq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("faq.submitError"));
      }

      setSubmitStatus({
        success: true,
        message: t("faq.success"),
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error("Erreur de soumission:", error);
      setSubmitStatus({
        success: false,
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu d'une question selon son type
  const renderQuestion = (question) => {
    const currentValue = responses[question.id] || "";
    const translateOption = (option) => {
      const optionKeys = {
        "Très insatisfait": "veryDissatisfied", "Insatisfait": "dissatisfied", "Neutre": "neutral",
        "Satisfait": "satisfied", "Très satisfait": "verySatisfied", Oui: "yes", Non: "no",
        "Je ne sais pas": "dontKnow", "Totalement pas d'accord": "stronglyDisagree",
        "Pas d'accord": "disagree", "D'accord": "agree", "Totalement d'accord": "stronglyAgree",
      };
      return t(`faq.options.${optionKeys[option] || option}`);
    };

    switch (question.type) {
      case "select":
        return (
          <select
            value={currentValue}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            required
          >
            <option value="">{t("faq.selectPlaceholder")}</option>
            {question.options.map(option => (
              <option key={option} value={option}>{translateOption(option)}</option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="radio-group">
            {question.options.map(option => (
              <label key={option}>
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={() => handleResponseChange(question.id, option)}
                  required
                />
                {translateOption(option)}
              </label>
            ))}
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            required
            rows={4}
            placeholder={t("faq.answerPlaceholder")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="faq-container">
      <header className="faq-header">
        <h1>{t("faq.title")}</h1>
        <p>{t("faq.subtitle")}</p>
      </header>

      {submitStatus.message && (
        <div className={`alert ${submitStatus.success ? "alert-success" : "alert-error"}`}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="faq-form">
        {questions.map(question => (
          <div key={question.id} className="question-card">
            <h3>{t(`faq.questions.${question.id}`)}</h3>
            <div className="question-input">
              {renderQuestion(question)}
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`submit-btn ${isSubmitting ? "loading" : ""}`}
          >
            {isSubmitting ? t("faq.submitting") : t("faq.submit")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Faq;
