import React from "react";
import NewspaperReview from "../reviews/NewspaperReview";
import "../../styles/JounalView.css";
import { useTranslation } from "react-i18next";

function JournalsView() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="newspaper-layout">
        <NewspaperReview />
        <div className="newspaper-container">
          <h1 className="newspaper-h1">{t("journals.title")}</h1>
          <div className="images-grid">
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt={t("journals.imageAlt")}
              />
              <div>
                <h3>
                  <a href="/review">AEGC Review</a>
                </h3>
                <p>
                  {t("journals.description")}
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt={t("journals.imageAlt")}
              />
              <div>
                <h3>
                  <a href="">AEGC Economic Review</a>
                </h3>
                <p>
                  {t("journals.description")}
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt={t("journals.imageAlt")}
              />
              <div>
                <h3>
                  <a href="">Management Review</a>
                </h3>
                <p>
                  {t("journals.description")}
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt={t("journals.imageAlt")}
              />
              <div>
                <h3>
                  <a href="">Reserch</a>
                </h3>
                <p>
                  {t("journals.description")}
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWERCc5vyeR7GnmY3C6Wi3uqjmYLdmNe9Cg&s"
                alt={t("journals.imageAlt")}
              />
              <div>
                <h3>
                  <a href="">AEGC Metadata</a>
                </h3>
                <p>
                  {t("journals.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JournalsView
