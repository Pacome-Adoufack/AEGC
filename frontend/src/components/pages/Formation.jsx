import React, { useState, useEffect } from "react";
import "../../styles/Formation.css";
import logo from "../../assets/formation.png";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url"; // pense à vérifier que ce fichier contient bien ton URL de base, ex: http://localhost:3000
import ConfirmDialog from "../common/ConfirmDialog";
import { useTranslation } from "react-i18next";

function Formations() {
  const { t, i18n } = useTranslation();
  const [formations, setFormations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const openConfirm = ({ title, message, onConfirm, type = 'danger' }) => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type });
  };

  // Charger les formations
  useEffect(() => {
    const fetchFormations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/formations`);
        if (!res.ok) throw new Error(t("formations.fetchError"));
        const data = await res.json();
        setFormations(data);
      } catch (error) {
        console.error(error);
        setMessage(t("formations.fetchError"));
      }
    };
    fetchFormations();
  }, [t]);

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
          throw new Error(t("formations.reservationsError"));

        const data = await res.json();
        setReservations(data);
      } catch (error) {
        console.error(error);
        setMessage(t("formations.reservationsError"));
      }
    };
    fetchReservations();
  }, [t]);

  // Annuler une réservation
  const handleDeleteReservation = async (Id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reservation-formation/${Id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error ||
            t("formations.cancelError")
        );
      }

      // Met à jour l'état local
      setReservations((prev) => prev.filter((r) => r._id !== Id));
    } catch (error) {
      console.error(error);
      setMessage(
        `${t("formations.errorPrefix")} : ${error.message}`
      );
    }
  };

  const askDeleteReservation = (Id) => {
    openConfirm({
      title: t("formations.cancelTitle"),
      message: t("formations.cancelConfirm"),
      onConfirm: () => handleDeleteReservation(Id),
    });
  };

  return (
    <>
    <div className="formations-container">
      <h2>{t("formations.title")}</h2>
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
              <img
                src={logo}
                alt={t("formations.logoAlt")}
              />
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <p>
                <strong>{t("formations.teacher")}</strong>{" "}
                <Link className="doctor-link" to={`/teacher/${f.teacherId}`}>
                  {f.teacher}
                </Link>
              </p>
              <p>
                <strong>{t("formations.date")}</strong> {new Intl.DateTimeFormat(i18n.language).format(new Date(f.date))}
              </p>
              <p>
                <strong>{t("formations.duration")}</strong> {f.duration}
              </p>
              <p>
                <strong>{t("formations.level")}</strong> {f.level}
              </p>
              <p>
                <strong>{t("formations.price")}</strong> {f.price} €
              </p>
              <p>
                <strong>{t("formations.location")}</strong> {f.location}
              </p>

              <div className="boutton-section">
                  {reservation ? (
                  <button
                    onClick={() => askDeleteReservation(reservation._id)}
                    className="delete-button"
                  >
                    {t("formations.cancel")}
                  </button>
                ) : (
                  <Link
                    to={`/formations-details/${f._id}`}
                    className="inscription-button"
                  >
                    {t("formations.details")}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <ConfirmDialog
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      type={confirmState.type}
      onConfirm={() => {
        if (typeof confirmState.onConfirm === "function") confirmState.onConfirm();
      }}
      onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
    />
    </>
  );
}

export default Formations;
