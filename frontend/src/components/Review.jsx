import React, { useState } from "react";
import "../styles/Review.css";
import NewspaperReview from "./NewspaperReview";
import { useNavigate } from "react-router-dom";

const Review = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVolume, setSelectedVolume] = useState("");
  const navigate = useNavigate();
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
              alt="Journal AEGC"
              className="review-image"
            />
            <div className="review-title-section">
              <h1 className="review-title">AEGC Review</h1>
              <select className="review-select">
                <option value="">Trier par :</option>
                <option value="title">Titre</option>
                <option value="author">Auteur</option>
              </select>
            </div>
          </div>
          <p className="review-description">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Consequuntur, deleniti voluptates itaque dolorum aut porro sit
            numquam voluptate delectus labore maxime amet non culpa perspiciatis
            reprehenderit alias sapiente? Atque, sunt?
          </p>
          <div className="review-actions">
            <input
              type="text"
              className="review-search-input"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="review-volume-select"
            onChange={handleVolumeChange}
            defaultValue=""
          >
            <option value="">2025 - Volume 1</option>
            <option value="janvier">Janvier 2025 (Vol.1, No1)</option>
            <option value="mai">Mai 2025 (Vol.1, No2)</option>
            <option value="décembre">Décembre 2025 (Vol.1, No3)</option>
          </select>
        </div>
      </div>
    // </div>
  );
};

export default Review;
