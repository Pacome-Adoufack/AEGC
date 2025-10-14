import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";
import "../styles/FormationsDetails.css";
import logo from "../assets/formation.png";

const FormationsCard = () => {
  const { formationId } = useParams();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger la formation spécifique
  useEffect(() => {
    const fetchFormation = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/formations/${formationId}`);
        if (!res.ok) throw new Error("Impossible de charger les détails.");
        const data = await res.json();
        setFormation(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de la formation.");
      } finally {
        setLoading(false);
      }
    };
    fetchFormation();
  }, [formationId]);

  if (loading) return <p className="loading">Chargement...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!formation) return <p>Aucune formation trouvée.</p>;

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
              <strong>Formateur :</strong> {formation.teacher}
            </p>
            <p>
              <strong>Date :</strong> {formation.date}
            </p>
            <p>
              <strong>Durée :</strong> {formation.duration}
            </p>
            <p>
              <strong>Niveau :</strong> {formation.level}
            </p>
            <p>
              <strong>Prix :</strong> {formation.price} €
            </p>
            <p>
              <strong>Lieu :</strong> {formation.location}
            </p>
          </div>

          <div className="formation-actions">
            <Link
              to={`/inscription-formation/${formation._id}`}
              className="inscription-button"
            >
              S’inscrire à cette formation
            </Link>

            <Link to="/formations" className="back-button">
              ← Retour aux formations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationsCard;
