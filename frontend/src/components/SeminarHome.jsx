import React, { useEffect, useState } from "react";
import "../styles/Activity.css";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";
import logo1 from "../assets/logo1.png";
import ConfirmDialog from "./common/ConfirmDialog";

const SeminarHome = () => {
  const [activities, setActivities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger",
  });

  const openConfirm = ({ title, message, onConfirm, type = "danger" }) => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type });
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/activities`);
        if (!response.ok)
          throw new Error("Erreur lors du chargement des activités");
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error(error);
        setMessage("Impossible de charger les activités.");
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/reservation-activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error("Erreur lors du chargement des réservations");

        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error(error);
        setMessage("Impossible de charger vos réservations.");
      }
    };
    fetchReservations();
  }, []);

  const handleDeleteReservation = async (Id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reservation/${Id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'annulation.");
      }

      setReservations((prev) =>
        prev.filter((r) => r._id.toString() !== Id.toString())
      );
    } catch (error) {
      console.error(error);
      setMessage(`Erreur : ${error.message}`);
    }
  };

  const askDeleteReservation = (Id) => {
    openConfirm({
      title: "Annuler la réservation",
      message: "Êtes-vous sûr de vouloir annuler cette réservation ?",
      onConfirm: () => handleDeleteReservation(Id),
      type: "danger",
    });
  };

  const scrollGallery = (direction) => {
    const container = document.getElementById("scroll-gallery");
    const scrollAmount = 300;

    if (container) {
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const renderActivity = (activity) => {
    const seminarDate = new Date(activity.date);
    const now = new Date();
    const isPast = seminarDate < now;
    const reservation = reservations.find((r) => {
      if (!r.activity) return false;
      const rId = typeof r.activity === "object" ? r.activity._id : r.activity;
      return String(rId) === String(activity._id);
    });

    return (
      <div key={activity._id} className="activity-card">
        <img src={logo1} alt={activity.name || 'logo'} className="logo1" />
        <div className="activity-card-content">
          <div className="first-card">
            <h2>{activity.name}</h2>
            <p>{activity.description}</p>
          </div>

          <div className="activity-meta">
            <p className="activity-date">
              <FaCalendarAlt className="icon" />
              <span>{activity.date}</span>
            </p>
            <div className="divider"></div>
            <p className="activity-timezone">
              🕑 Heure de Paris : <span>{activity.timeParis}</span>
            </p>
            <div className="divider"></div>
            <p className="activity-timezone">
              🕑 Heure de Yaoundé : <span>{activity.timeYaounde}</span>
            </p>
          </div>

          <div className="activity-info">
            <p className="moderator">
              <strong>Modérateur :</strong> {" "}
              <Link className="doctor-link" to={`/speaker/${activity.presenterId}`}>
                {activity.moderator}
              </Link>
            </p>
            <p className="subtitle">{activity.subtitleModerator}</p>
            <div className="participant-card">
              {activity.participants && activity.participants.length > 0 ? (
                activity.participants.map((p, index) => (
                  <div key={index}>
                    <p>
                      <strong>Intervenant :</strong> 
                      <Link className="doctor-link" to={`/speaker/${activity.presenterId}`}>
                        {p.name}
                      </Link>
                    </p>
                    <p className="subtitle">{p.subtitle}</p>
                  </div>
                ))
              ) : (
                <p>Aucun intervenant pour ce séminaire.</p>
              )}
            </div>
          </div>
        </div>

        <div className="boutton-section">
          <div className="card-actions">
            {isPast ? (
              <Link to={`/questionnaire`} className="reserve-button">
                Questionnaire
              </Link>
            ) : reservation ? (
              <button onClick={() => askDeleteReservation(reservation._id)} className="delete-button">
                Annuler réservation
              </button>
            ) : (
              <Link to={`/reservation/${activity._id}`} className="reserve-button">
                Réserver
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="meeting-container">
      <div className="meeting-content">
        <h1>Nos Prochains Séminaires</h1>
        {message && <p className="message">{message}</p>}

        <div className="scroll-controls">
          <button
            className="arrow-button left"
            onClick={() => scrollGallery("left")}
          >
            <FaArrowLeft />
          </button>

          <div className="activity-scroll-container" id="scroll-gallery">
            {activities.map(renderActivity)}
          </div>

        <button
          className="arrow-button right"
          onClick={() => scrollGallery("right")}
        >
          <FaArrowRight />
        </button>
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
      </div>
    </div>
    </div >
  );
};

export default SeminarHome;
