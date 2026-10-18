import React from "react";
import "@/styles/Newspaper.css";
import { useTranslation } from "react-i18next";

function NewspaperReview() {
  const { t } = useTranslation();

  return (
    <div>
      <nav className="newspaperreview">
        <h2>
          <a href="/journal view">{t("newspaperReview.title")}</a>
        </h2>
        <ul>
          <li>
            <a href="/journal/review">{t("newspaperReview.aegcReview")}</a>
          </li>
          <li>
            <a href="/economic review">{t("newspaperReview.economicReview")}</a>
          </li>
          <li>
            <a href="/management review">{t("newspaperReview.managementReview")}</a>
          </li>
          <li>
            <a href="/research">{t("newspaperReview.research")}</a>
          </li>
          <li>
            <a href="/metadata">{t("newspaperReview.metadata")}</a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default NewspaperReview;
