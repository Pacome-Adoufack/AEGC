import React, { useState } from "react";
import "@/styles/Review.css";
import NewspaperReview from "./NewspaperReview";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Review = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVolume, setSelectedVolume] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleVolumeChange = (event) => {
    const volume = event.target.value;
    setSelectedVolume(volume);
    if (volume) {
      navigate(`/review/${volume}`);
    } else {
      navigate("/review");
    }
  };

  return (
    <div className="review-layout">
      <NewspaperReview />
      {/* <div className="review-container"> */}
      <div className="review-card">
        <div className="review-header">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
            alt={t("reviews.journalAlt")}
            className="review-image"
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
        <p className="review-description">{t("reviews.description")}</p>
        <div className="review-actions">
          <input
            type="text"
            className="review-search-input"
            placeholder={t("reviews.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="review-volume-select"
          onChange={handleVolumeChange}
          defaultValue=""
        >
          <option value="">{t("reviews.volume")}</option>
          <option value="janvier">{t("reviews.januaryIssue")}</option>
          <option value="mai">{t("reviews.mayIssue")}</option>
          <option value="décembre">{t("reviews.decemberIssue")}</option>
        </select>
      </div>
    </div>
    // </div>
  );
};

export default Review;
