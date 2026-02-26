import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";

const MesActivitesReservees = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    fetch(`${API_BASE_URL}/api/reservation-activity`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur chargement réservations");
        return res.json();
      })
      .then(data => {
        console.log("Réservations reçues :", data); // <-- ici
        setReservations(data);
      })
      .catch(err => console.error(err));
  }, []);


  return (
    <div className="reservations-container">
      <h2>Mes Webinaire assistés</h2>
      {reservations.length === 0 ? (
        <p>Aucune activité réservée.</p>
      ) : (
        reservations.map(r => (
          <div key={r._id} className="reservation-card">
            <h3>{r.activity?.name}</h3>
            <p><strong>Date :</strong> {r.activity?.date}</p>
            <p><strong>Heure de Paris:</strong> {r.activity?.timeParis}</p>
            <p><strong>Heure de Yaoundé:</strong> {r.activity?.timeYaounde}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MesActivitesReservees;
