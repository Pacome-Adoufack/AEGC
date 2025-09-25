import React, { useEffect, useState } from "react";
import "../styles/Activity.css";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";

const Seminar = () => {
  const [activities, setActivities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log("Reservations mises à jour :", reservations);
  }, [reservations]);

  // Charger les activités
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/activities`);
        if (!response.ok)
          throw new Error("Erreur lors du chargement des activités");
        const data = await response.json();
        setActivities(data);
        console.log("Activités chargées :", data);
      } catch (error) {
        console.error(error);
        setMessage("Impossible de charger les activités.");
      }
    };
    fetchActivities();
  }, []);

  // Charger les réservations utilisateur
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        console.log("Token utilisé :", token); // ← debug important

        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/reservation`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error("Erreur lors du chargement des réservations");

        const data = await response.json();
        console.log("Réservations chargées :", data);
        setReservations(data);
      } catch (error) {
        console.error("Erreur attrapée :", error);
        setMessage("Impossible de charger vos réservations.");
      }
    };

    fetchReservations();
  }, []);

  // Annuler une réservation
  const handleDeleteReservation = async (Id) => {
    console.log("Deleting ID:", Id);
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/reservation/${Id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'annulation.");
      }

      setReservations((prev) =>
        prev.filter((r) => r._id.toString() !== Id.toString())
      );
      console.log("Réservation annulée avec succès :", Id);
    } catch (error) {
      console.error(error);
      setMessage(`Erreur : ${error.message}`);
    }
  };

  return (
    <div className="newspaper-layout">
      <nav className="newspaper-nav">
        <ul>
          <li>
            <Link to="/seminaires">AEGC Séminaires</Link>
          </li>
          <li>
            <Link to="/web binaire">AEGC Web Binaire</Link>
          </li>
          <li>
            <Link to="/conference">AEGC Conférences</Link>
          </li>
          <li>
            <Link to="/images">AEGC Photos</Link>
          </li>
        </ul>
      </nav>

      <div className="meeting-container">
        <div className="meeting-content">
          <h1>Nos Séminaires</h1>
          {message && <p className="message">{message}</p>}

          <div className="activity-images-grid">
            {activities.map((activity) => {
              const reservation = reservations.find((r) => {
                if (!r.activity) return false;
                const rId =
                  typeof r.activity === "object" ? r.activity._id : r.activity;
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

                    <p>
                      <strong>Présenté par :</strong>{" "}
                      <Link
                        className="doctor-link"
                        to={`/speaker/${activity.presenterId}`}
                      >
                        {activity.presenter}
                      </Link>
                    </p>

                    <div className="card-actions">
                      {reservation ? (
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
        </div>
      </div>
    </div>
  );
};

export default Seminar;
