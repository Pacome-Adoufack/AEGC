import React from "react";
import "../styles/Newspaper.css";
import NewspaperReview from "./NewspaperReview";

function Newspaper() {
  return (
    <div className="newspaper-layout">
      <NewspaperReview />
      <div className="newspaper-container">
        <h1 className="newspaper-h1">Journal</h1>
        <div className="images-grid">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
            alt=""
          />
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
            alt=""
          />
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
            alt=""
          />
        </div>
      </div>
    </div>
  );
}

export default Newspaper;
