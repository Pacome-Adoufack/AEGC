import React, { useState } from "react";
import NewspaperReview from "./NewspaperReview";
import "@/styles/JanuaryReview.css";
import { useTranslation } from "react-i18next";

function JanuarReview() {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  return (
    <div>
      <div className="review-layout">
        <NewspaperReview />
        <div className="review-card">
          <div className="review-header">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
              alt={t("reviews.journalAlt")}
            // className="review-image"
            />
            <div className="review-title-section">
                <h1 className="review-title">{t("reviews.title")}</h1>
              <select className="review-select">
                <option value="">{t("reviews.sortBy")}</option>
                <option value="title">{t("reviews.titleSort")}</option>
                <option value="author">{t("reviews.authorSort")}</option>
              </select>
            </div>
          </div>
          <p className="paragraph-volume">{t("reviews.januaryIssueShort")}</p>
          <div className="review-actions">
            <input
              type="text"
              className="review-search-input"
              placeholder={t("reviews.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <h3 className="article-titel">{t("reviews.articles")}</h3>
          <div className="article-card">
            <h4 className="article-titel">
              <a className="article-link" href="/programmation">
                {t("reviews.programmingArticle")}
              </a>
            </h4>
            <p className="author">
              {t("reviews.publishedBy")} Dr Pacome adoufack Tsamo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JanuarReview;
