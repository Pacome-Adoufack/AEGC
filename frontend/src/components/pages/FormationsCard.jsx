import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import "../../styles/FormationsDetails.css";
import logo from "../../assets/formation.png";
import { useTranslation } from "react-i18next";

const FormationsCard = () => {
  const { t, i18n } = useTranslation();
  const { formationId } = useParams();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger la formation spécifique
  useEffect(() => {
    const fetchFormation = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/formations/${formationId}`);
        if (!res.ok) throw new Error(t("formations.loadError"));
        const data = await res.json();
        setFormation(data);
      } catch (err) {
        console.error(err);
        setError(t("formations.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchFormation();
  }, [formationId, t]);

  if (loading) return <p className="loading">{t("formations.loading")}</p>;
  if (error) return <p className="error">{error}</p>;
  if (!formation) return <p>{t("formations.empty")}</p>;

  return (
    <div className="formation-details-container">
      <div className="formation-details-card">
        <img
          src={formation.image || logo}
          alt={formation.title}
          className="formation-details-image"
        />

        <div className="formation-details-content">
          <h2>{formation.title}</h2>
          <p className="formation-description">{formation.description}</p>

          <div className="formation-info">
            <p>
              <strong>{t("formations.teacher")}</strong> {formation.teacher}
            </p>
            <p>
              <strong>{t("formations.date")}</strong> {new Intl.DateTimeFormat(i18n.language).format(new Date(formation.date))}
            </p>
            <p>
              <strong>{t("formations.duration")}</strong> {formation.duration}
            </p>
            <p>
              <strong>{t("formations.level")}</strong> {formation.level}
            </p>
            <p>
              <strong>{t("formations.price")}</strong> {formation.price} €
            </p>
            <p>
              <strong>{t("formations.location")}</strong> {formation.location}
            </p>
          </div>

          <div className="formation-actions">
            <Link
              to={`/inscription-formation/${formation._id}`}
              className="inscription-button"
            >
              {t("formations.register")}
            </Link>

            <Link to="/formations" className="back-button">
              ← {t("formations.back")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationsCard;
