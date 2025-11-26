import React, { useEffect, useState } from "react";
import "../styles/Seminar.css";
import { FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";
import logo1 from "../assets/logo1.png";

const Seminar = () => {
  const [activities, setActivities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(new Date()); // timer global

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getCountdown = (targetDate) => {
    const diff = new Date(targetDate) - now;

    if (diff <= 0) return "Terminé";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${days}j ${hours}h ${minutes}m ${seconds}s`;
  };

  // Charger activités
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/activities`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        setMessage("Impossible de charger les activités.");
      }
    };
    fetchActivities();
  }, []);

  // Charger réservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/reservation`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        setReservations(data);
      } catch (error) {
        setMessage("Impossible de charger vos réservations.");
      }
    };
    fetchReservations();
  }, []);

  const handleDeleteReservation = async (Id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/reservation/${Id}`, {
        method: "DELETE",
      });

      setReservations((prev) =>
        prev.filter((r) => r._id.toString() !== Id.toString())
      );
    } catch (error) {
      setMessage("Erreur lors de l'annulation.");
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
    <>
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

            <div id="scroll-gallery" className="activity-scroll-container">
              {activities.map((activity) => {
                const seminarDate = new Date(activity.date);
                const oneWeekAfter = new Date(
                  seminarDate.getTime() + 7 * 24 * 60 * 60 * 1000
                );

                const isPast = seminarDate < now;

                // Masquer après 7 jours
                if (now > oneWeekAfter)
                  return (
                    <p
                      style={{
                        color: "red",
                        fontWeight: "bold",
                        fontSize: "20px",
                        textAlign: "center",
                        marginTop: "20px",
                      }}
                    >
                      Aucun Webinaire pour l’instant
                    </p>
                  );

                const reservation = reservations.find((r) => {
                  const rId =
                    typeof r.activity === "object"
                      ? r.activity._id
                      : r.activity;
                  return String(rId) === String(activity._id);
                });

                return (
                  <div key={activity._id} className="activity-card">
                    <div className="countdown-container">
                      {/* Compte à rebours avant début */}
                      <p className="countdown">
                        ⏳ Début dans :{" "}
                        <span>{getCountdown(activity.date)}</span>
                      </p>

                      <img src={logo1} alt="Logo séminaire" className="logo1" />

                      {/* Compte à rebours avant disparition */}
                      <p className="countdown-small">
                        Disparaît dans :{" "}
                        <span>{getCountdown(oneWeekAfter)}</span>
                      </p>
                    </div>

                    <div className="activity-card-content">
                      <h2>{activity.name}</h2>
                      <p>{activity.description}</p>

                      <div className="activity-meta">
                        <p className="activity-date">
                          <FaCalendarAlt className="icon" />
                          <span>{activity.date}</span>
                        </p>

                        <div className="divider"></div>

                        <p className="activity-timezone">
                          🕑 Heure de Paris : {activity.timeParis}
                        </p>

                        <div className="divider"></div>

                        <p className="activity-timezone">
                          🕑 Heure de Yaoundé : {activity.timeYaounde}
                        </p>
                      </div>
                      <div className="activity-info">
                        {/* <div className="moderator">
                          <strong>Modérateur :</strong> {""}
                          <Link
                            className="doctor-link"
                            to={`/speaker/${activity.presenterId}`}
                          >
                            {activity.moderator}
                          </Link>
                          <p className="subtitle">
                            {activity.subtitleModerator}
                          </p>
                        </div> */}
                        <div className="moderator">
                          {activity.moderators &&
                          activity.moderators.length > 0 ? (
                            activity.moderators.map((m, index) => (
                              <div key={index}>
                                <p>
                                  <strong>Modérateur :</strong>{" "}
                                  <Link
                                    className="doctor-link"
                                    to={`/speaker/${activity.presenterId}`}
                                  >
                                    {m.name}
                                  </Link>
                                </p>
                                <p className="subtitle">{m.subtitle}</p>
                              </div>
                            ))
                          ) : (
                            <p>Aucun modérateur pour ce webinaire.</p>
                          )}
                        </div>
                        <div className="participant-card">
                          {activity.participants &&
                          activity.participants.length > 0 ? (
                            activity.participants.map((p, index) => (
                              <div key={index}>
                                <p>
                                  <strong>Intervenant :</strong>{" "}
                                  <Link
                                    className="doctor-link"
                                    to={`/speaker/${activity.presenterId}`}
                                  >
                                    {p.name}
                                  </Link>
                                </p>
                                <p className="subtitle">{p.subtitle}</p>
                              </div>
                            ))
                          ) : (
                            <p>Aucun intervenant pour ce webinaire.</p>
                          )}
                        </div>
                      </div>

                      <div className="card-actions">
                        {isPast ? (
                          <Link to="/questionnaire" className="reserve-button">
                            Questionnaire
                          </Link>
                        ) : reservation ? (
                          <button
                            onClick={() =>
                              handleDeleteReservation(reservation._id)
                            }
                            className="delete-button"
                          >
                            Annuler réservation
                          </button>
                        ) : (
                          <Link
                            to={`/reservation/${activity._id}`}
                            className="reserve-button"
                          >
                            Réserver
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="arrow-button right"
              onClick={() => scrollGallery("right")}
            >
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Seminar;
