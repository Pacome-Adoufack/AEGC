import React from "react";
import NewspaperReview from "./NewspaperReview";
import "../styles/Programmation.css";

const Programmation = () => {
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
            </div>
          </div>
          <div>
            <h3>AEGC Programmation</h3>
            <p>publié par: Dr Pacome Adoufack Tsamo</p>
            <p>Vol1, No1, Janvier 2025</p>
          </div>
          <div>
            <h4>Résumé</h4>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Recusandae, ea laboriosam? Exercitationem, reprehenderit.
              Voluptate, aliquam magni. Ipsam ex distinctio temporibus,
              molestias recusandae quia veniam saepe repudiandae odit est?
              Nesciunt quos quibusdam ad blanditiis delectus tempora amet
              obcaecati et quisquam ducimus? Impedit perspiciatis eius
              reiciendis explicabo ipsam praesentium illum sit labore.
            </p>
          </div>
          <div>
            <h4>JEL Classification</h4>
            <div>
              <p>
                <strong>D02</strong> - Institutions: Design, Formation,
                Organisation et Rôle
              </p>
              <p>
                <strong>D03</strong> - Institutions: Comportement des Agents,
                Rôle des Institutions
              </p>
              <p>
                <strong>D83</strong> - Information, Connaissance et Incertitude
              </p>
            </div>
          </div>
          <div>
            <a href="/public/Anschreibung bei i22.pdf" download>
              Télécharger le PDF
            </a>
          </div>
        </div>
      </div>
    // </div>
  );
};

export default Programmation;
