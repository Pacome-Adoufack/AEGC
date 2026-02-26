import React, { useState, useEffect } from "react";
import "../styles/Formation.css";
import logo from "../assets/formation.png";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../components/Url"; // pense à vérifier que ce fichier contient bien ton URL de base, ex: http://localhost:3000

function Formations() {
  const [formations, setFormations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");

  // Charger les formations
  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/formations`);
        if (!res.ok) throw new Error("Erreur lors du chargement des formations");
        const data = await res.json();
        setFormations(data);
      } catch (error) {
        console.error(error);
        setMessage("Impossible de charger les formations.");
      }
    };
    fetchFormations();
  }, []);

  // Charger les réservations de l'utilisateur connecté
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return; // si pas connecté, pas de réservations

        const res = await fetch(`${API_BASE_URL}/api/reservation-formation`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok)
          throw new Error("Erreur lors du chargement des réservations");

        const data = await res.json();
        setReservations(data);
      } catch (error) {
        console.error(error);
        setMessage("Impossible de charger vos réservations.");
      }
    };
    fetchReservations();
  }, []);

  // Annuler une réservation
  const handleDeleteReservation = async (Id) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir annuler cette inscription ?")
    )
      return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservation-formation/${Id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de l'annulation.");
      }

      // Met à jour l'état local
      setReservations((prev) => prev.filter((r) => r._id !== Id));
    } catch (error) {
      console.error(error);
      setMessage(`Erreur : ${error.message}`);
    }
  };

  return (
    <div className="formations-container">
      <h2>Nos Formations</h2>
      {message && <p className="message">{message}</p>}

      <div className="formations-grid">
        {formations.map((f) => {
          // Vérifie si l'utilisateur a déjà réservé cette formation
          const reservation = reservations.find((r) => {
            if (!r.formationId) return false;
            const rId =
              typeof r.formationId === "object" ? r.formationId._id : r.formationId;
            return String(rId) === String(f._id);
          });
          

          return (
            <div key={f._id} className="formation-card">
              <img src={logo} alt="logo" />
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <p>
                <strong>Formateur:</strong>{" "}
                <Link className="doctor-link" to={`/teacher/${f.teacherId}`}>
                  {f.teacher}
                </Link>
              </p>
              <p>
                <strong>Date:</strong> {f.date}
              </p>
              <p>
                <strong>Durée:</strong> {f.duration}
              </p>
              <p>
                <strong>Niveau:</strong> {f.level}
              </p>
              <p>
                <strong>Prix:</strong> {f.price} €
              </p>
              <p>
                <strong>Lieu:</strong> {f.location}
              </p>

              <div className="boutton-section">
                {reservation ? (
                  <button
                    onClick={() => handleDeleteReservation(reservation._id)}
                    className="delete-button"
                  >
                    Annuler l’inscription
                  </button>
                ) : (
                  <Link
                    to={`/formations-details/${f._id}`}
                    className="inscription-button"
                  >
                    voir plus de détails
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Formations;
