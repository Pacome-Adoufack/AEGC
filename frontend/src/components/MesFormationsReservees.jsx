import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";
import "../styles/MesFormationsReservees.css";

const MesFormationsReservees = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    fetch(`${API_BASE_URL}/api/reservation-formation`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors du chargement des réservations");
        return res.json();
      })
      .then((data) => {
        setReservations(data);
        console.log("Reservations fetched:", data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="reservations-container">
      <h2>Mes Formations Réservées</h2>

      {reservations.length === 0 ? (
        <p>Aucune formation réservée.</p>
      ) : (
        reservations.map((res) => (
          <div key={res._id} className="reservation-card">
            <h3>{res.formationId?.title}</h3>
            <p><strong>Date :</strong> {res.formationId?.date}</p>
            <p><strong>Professeur :</strong> {res.formationId?.teacher}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MesFormationsReservees;
