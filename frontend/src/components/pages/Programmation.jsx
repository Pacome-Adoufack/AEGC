import React from "react";
import NewspaperReview from "../reviews/NewspaperReview";
import "../../styles/Programmation.css";
import { useTranslation } from "react-i18next";

const Programmation = () => {
  const { t } = useTranslation();
  return (
    <div className="review-layout">
      <NewspaperReview />
      {/* <div className="review-container"> */}
      <div className="review-card">
        <div className="review-header">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
            alt={t("programming.journalAlt")}
            className="review-image"
          />
          <div className="review-title-section">
            <h1 className="review-title">{t("programming.reviewTitle")}</h1>
          </div>
        </div>
        <div>
          <h3>{t("programming.title")}</h3>
          <p>{t("programming.publishedBy")} Dr Pacome Adoufack Tsamo</p>
          <p>{t("programming.issue")}</p>
        </div>
        <div>
          <h4>{t("programming.summary")}</h4>
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
          <h4>{t("programming.classification")}</h4>
          <div>
            <p>
              <strong>D02</strong> - {t("programming.d02")}
            </p>
            <p>
              <strong>D03</strong> - {t("programming.d03")}
            </p>
            <p>
              <strong>D83</strong> - {t("programming.d83")}
            </p>
          </div>
        </div>
        <div>
          <a href="/public/Anschreibung bei i22.pdf" download>
            {t("programming.download")}
          </a>
        </div>
      </div>
    </div>
    // </div>
  );
};

export default Programmation;
