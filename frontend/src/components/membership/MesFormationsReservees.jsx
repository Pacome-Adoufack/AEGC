import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import "@/styles/MesFormationsReservees.css";
import { useTranslation } from "react-i18next";

const MesFormationsReservees = () => {
  const { t, i18n } = useTranslation();
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
  }, [navigate]);

  return (
    <div className="reservations-container">
      <h2>{t("membersArea.reservedTrainings")}</h2>

      {reservations.length === 0 ? (
        <p>{t("membersArea.empty")}</p>
      ) : (
        reservations.map((res) => (
          <div key={res._id} className="reservation-card">
            <h3>{res.formationId?.title}</h3>
            <p><strong>{t("membersArea.date")}</strong> {new Intl.DateTimeFormat(i18n.language).format(new Date(res.formationId?.date))}</p>
            <p><strong>{t("membersArea.teacher")}</strong> {res.formationId?.teacher}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MesFormationsReservees;
