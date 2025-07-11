import React, { useState } from "react";
import NewspaperReview from "./NewspaperReview";
import "../styles/JanuaryReview.css"; 

function JanuarReview() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div>
      <div className="review-layout">
        <NewspaperReview />
        <div className="review-card">
          <div className="review-header">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
              alt="Journal AEGC"
              // className="review-image"
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
          <p className="paragraph-volume">Vol1, No1, Janvier 2025</p>
          <div className="review-actions">
            <input
              type="text"
              className="review-search-input"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <h3 className="article-titel">Articles</h3>
          <div className="article-card">
            <h4 className="article-titel">
              <a className="article-link" href="/programmation">
                AEGC programmation
              </a>
            </h4>
            <p className="author">Publié par: Dr Pacome adoufack Tsamo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JanuarReview;
