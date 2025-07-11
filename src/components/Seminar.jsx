import React, { useEffect, useState } from "react";
import "../styles/Activity.css";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Seminar = () => {
  const [activities, setActivities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");

  // Charger les activités depuis l'API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/activities");
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

  // Charger les réservations de l'utilisateur (via token)
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return; // pas connecté

        const response = await fetch("http://localhost:3000/reservation", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error("Erreur lors du chargement des réservations");
        const data = await response.json();
        console.log("Réservations récupérées :", data);
        setReservations(data);
      } catch (error) {
        console.error(error);
        setMessage("Impossible de charger vos réservations.");
      }
    };
    fetchReservations();
  }, []);

  // Supprimer une réservation existante
  const handleDeleteReservation = async (reservationId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?"))
      return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Vous devez être connecté pour annuler une réservation.");
        return;
      }

      const response = await fetch(
        `http://localhost:3000/reservation/${reservationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'annulation.");
      }

      setReservations((prev) => prev.filter((r) => r._id !== reservationId));
      setMessage("Réservation annulée avec succès.");
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
            <Link to="/seminaires">AEGC Seminaires</Link>
          </li>
          <li>
            <Link to="/web binaire">AEGC Web Binaire</Link>
          </li>
          <li>
            <Link to="/conference">AEGC Conference</Link>
          </li>
          <li>
            <Link to="/photos">AEGC Photos</Link>
          </li>
        </ul>
      </nav>

      <div className="meeting-container">
        <div className="meeting-content">
          <h1>Nos Séminaires</h1>
          {message && <p className="message">{message}</p>}
          <div className="activity-images-grid">
            {activities.map((activity) => {
              // Vérifier si l'utilisateur a réservé cette activité
              const reservation = reservations.find(
                (r) => r.activity.toString() === activity._id.toString()
              );
              
              console.log("Activity ID:", activity._id);
              console.log("Réservations:", reservations);

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
