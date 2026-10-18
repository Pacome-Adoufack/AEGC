import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import { useTranslation } from "react-i18next";

const MesActivitesReservees = () => {
  const { t, i18n } = useTranslation();
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
  }, [navigate]);


  return (
    <div className="reservations-container">
      <h2>{t("seminars.title")}</h2>
      {reservations.length === 0 ? (
        <p>{t("membersArea.empty")}</p>
      ) : (
        reservations.map(r => (
          <div key={r._id} className="reservation-card">
            <h3>{r.activity?.name}</h3>
            <p><strong>{t("membersArea.date")}</strong> {new Intl.DateTimeFormat(i18n.language).format(new Date(r.activity?.date))}</p>
            <p><strong>{t("seminars.parisTime")}</strong> {r.activity?.timeParis}</p>
            <p><strong>{t("seminars.yaoundeTime")}</strong> {r.activity?.timeYaounde}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MesActivitesReservees;
