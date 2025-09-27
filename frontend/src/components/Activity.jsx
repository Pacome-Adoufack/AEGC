import React, { useEffect, useState } from "react";
import "../styles/Activity.css";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import {API_BASE_URL} from "../components/Url"

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupère les activités
        const resActivities = await fetch(
          `${API_BASE_URL}/api/activities`
        );
        const activities = await resActivities.json();

        // 2. Récupère les réservations utilisateur (avec token)
        const resReservations = await fetch(
          `${API_BASE_URL}/reservation`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const reservations = await resReservations.json();
        const reservedActivityIds = reservations.map((r) => r.activity._id);

        // 3. Ajoute un champ `isReserved` dans chaque activité
        const updatedActivities = activities.map((act) => ({
          ...act,
          isReserved: reservedActivityIds.includes(act._id),
          reservationId:
            reservations.find((r) => r.activity._id === act._id)?._id || null,
        }));

        setData(updatedActivities);
        console.log("Données finales :", updatedActivities);
      } catch (error) {
        console.error("Erreur de récupération :", error);
      }
    };

    fetchData();
  }, []);
  const handleCancel = async (Id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reservation/${Id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      if (res.ok) {
        setData((prevData) =>
          prevData.map((a) =>
            a.reservationId === Id
              ? { ...a, isReserved: false, reservationId: null }
              : a
          )
        );
      } else {
        console.error("Erreur lors de l'annulation de la réservation");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };
  

  return (
    <div className="newspaper-layout">
      <nav className="newspaper-nav">
        <ul>
          <li>
            <a href="/seminaires">AEGC Seminaires</a>
          </li>
          <li>
            <a href="/web binaire">AEGC Web Binaire</a>
          </li>
          <li>
            <a href="/conference">AEGC Conference</a>
          </li>
          <li>
            <a href="/picture">AEGC Photos</a>
          </li>
        </ul>
      </nav>

      <div className="meeting-container">
        <div className="meeting-content">
          <h1>Nos activités</h1>
          <div className="activity-images-grid">
            {data.map((activity) => (
              <div key={activity._id} className="activity-card">
                <img src={activity.image} alt={activity.name} />
                <div className="activity-card-content">
                  <h2>{activity.name}</h2>
                  <p>{activity.description}</p>
                  <p className="activity-date">
                    <FaCalendarAlt className="icon" />
                    <span>{new Date(activity.date).toLocaleDateString()}</span>
                  </p>
                  <p className="activity-location">
                    <FaMapMarkerAlt className="icon" />
                    <span>{activity.location}</span>
                  </p>
                  <p>
                    <strong>Présenté par :</strong>{" "}
                    <a className="doctor-link" href="/adoufack">
                      {activity.presenter}
                    </a>
                  </p>

                  <div>
                    {activity.isReserved ? (
                      <button
                        className="delete-button"
                        onClick={() => handleCancel(activity.reservationId)}
                      >
                        Annuler la réservation
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activity;
