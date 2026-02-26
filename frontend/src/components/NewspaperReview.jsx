import React from "react";
import "../styles/Newspaper.css";

function NewspaperReview() {
  return (
    <div>
      <nav className="newspaperreview">
        <h2>
          <a href="/journal view">Jounaux</a>
        </h2>
        <ul>
          <li>
            <a href="/journal/review">Revue AEGC</a>
          </li>
          <li>
            <a href="/papers and processing">Documents de l'AEGC et traitement des données</a>
          </li>
          <li>
            <a href="/economic review">Revue économique de l'AEGC</a>
          </li>
          <li>
            <a href="/management review">Examen de la gestion de l'AEGC</a>
          </li>
          <li>
            <a href="/research">AEGC Recherche</a>
          </li>
          <li>
            <a href="/metadata">Métadonnées de l'AEGC</a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default NewspaperReview;
