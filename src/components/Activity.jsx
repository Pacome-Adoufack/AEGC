import React, { useEffect, useState } from "react";
import "../styles/Activity.css";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Activity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/activities");
        const data = await response.json();
        setActivities(data);
        console.log("Activités chargées :", data);
        
      } catch (error) {
        console.error("Erreur lors du chargement des activités :", error);
      }
    };

    fetchActivities();
  }, []);

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
            <a href="/photos">AEGC Photos</a>
          </li>
        </ul>
      </nav>

      <div className="meeting-container">
        <div className="meeting-content">
          <h1>Nos activités</h1>
          <div className="activity-images-grid">
            {activities.map((activity) => (
              <div key={activity._id} className="activity-card">
                <img src={activity.image} alt={activity.name} />
                <div className="activity-card-content">
                  <h2>{activity.name}</h2>
                  <p>{activity.description}</p>
                  <p className="activity-date">
                  <FaCalendarAlt className="icon"/>
                    <span>{new Date(activity.date).toLocaleDateString()}</span>
                  </p>
                  <p className="activity-location">
                    <FaMapMarkerAlt className="icon"/>
                    <span>{activity.location}</span>
                  </p>
                  <p>
                    <strong>Présenté par :</strong>{" "}
                    <a className="doctor-link" href="/adoufack">
                      {activity.presenter}
                    </a>
                  </p>
                 <div>
                 <Link
                    to={`/reservation/${activity._id}`}
                    className="delete-button"
                  >
                    Annuler une réservation
                  </Link>
                  <Link
                    to={`/reservation/${activity._id}`}
                    className="reserve-button"
                  >
                    Réserver
                  </Link>
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
