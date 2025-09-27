import React, { useEffect, useState } from "react";
import "../styles/Activity.css";
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";

const SeminarHome = () => {
  const [activities, setActivities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/activities`);
        if (!response.ok) throw new Error("Erreur lors du chargement des activités");
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
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/reservation`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Erreur lors du chargement des réservations");

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
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reservation/${Id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'annulation.");
      }

      setReservations((prev) => prev.filter((r) => r._id.toString() !== Id.toString()));
    } catch (error) {
      console.error(error);
      setMessage(`Erreur : ${error.message}`);
    }
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

  return (
    <div className="meeting-container">
      <div className="meeting-content">
        <h1>Nos Prochains Séminaires</h1>
        {message && <p className="message">{message}</p>}

        <div className="scroll-controls">
          <button className="arrow-button left" onClick={() => scrollGallery("left")}>
            <FaArrowLeft />
          </button>

          <div className="activity-scroll-container" id="scroll-gallery">
            {activities.map((activity) => {
              const reservation = reservations.find((r) => {
                if (!r.activity) return false;
                const rId = typeof r.activity === "object" ? r.activity._id : r.activity;
                return String(rId) === String(activity._id);
              });

              return (
                <div key={activity._id} className="activity-card">
                  <img src={activity.image} alt={activity.name} />
                  <div className="activity-card-content">
                    <h2>{activity.name}</h2>
                    <p>{activity.description}</p>

                    <div className="activity-meta">
                      <p className="activity-date">
                        <FaCalendarAlt className="icon" />
                        <span>
                          {new Date(activity.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                      <p className="activity-location">
                        <FaMapMarkerAlt className="icon" />
                        <span>{activity.location}</span>
                      </p>
                    </div>

                    <p className="presenter">
                      <strong>Présenté par :</strong>{" "}
                      <Link className="doctor-link" to={`/speaker/${activity.presenterId}`}>
                        {activity.presenter}
                      </Link>
                    </p>

                   <div className="boutton-section">
                   <div className="card-actions">
                      {reservation ? (
                        <button onClick={() => handleDeleteReservation(reservation._id)} className="delete-button">
                          Annuler réservation
                        </button>
                      ) : (
                        <Link to={`/reservation/${activity._id}`} className="reserve-button">
                          Réserver
                        </Link>
                      )}
                    </div>
                    <div className="question-container">
                        <Link to={`/questionnaire`} className="question-button">
                            Evaluation
                        </Link>
                    </div>
                   </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="arrow-button right" onClick={() => scrollGallery("right")}>
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeminarHome;
