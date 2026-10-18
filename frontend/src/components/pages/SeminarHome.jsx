import React, { useEffect, useState } from "react";
import "../../styles/Activity.css";
import {
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import logo1 from "../../assets/logo1.png";
import ConfirmDialog from "../common/ConfirmDialog";

import { useTranslation } from "react-i18next";
const SeminarHome = () => {
  const [activities, setActivities] = useState([]);
  const { t } = useTranslation();
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
        setMessage(t("seminars.loadError"));
      }
    };
    fetchActivities();
  }, [t]);

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
        setMessage(t("seminars.reservationsError"));
      }
    };
    fetchReservations();
  }, [t]);

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
      setMessage(t("seminars.error", { message: error.message }));
    }
  };

  const askDeleteReservation = (Id) => {
    openConfirm({
      title: t("seminars.cancelTitle"),
      message: t("seminars.cancelConfirm"),
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
        <img src={logo1} alt={activity.name || t("seminars.logoAlt")} className="logo1" />
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
              🕑 {t("seminars.parisTime")} <span>{activity.timeParis}</span>
            </p>
            <div className="divider"></div>
            <p className="activity-timezone">
              🕑 {t("seminars.yaoundeTime")} <span>{activity.timeYaounde}</span>
            </p>
          </div>

          <div className="activity-info">
            <p className="moderator">
              <strong>{t("seminars.moderator")}</strong> {" "}
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
                      <strong>{t("seminars.speaker")}</strong>
                      <Link className="doctor-link" to={`/speaker/${activity.presenterId}`}>
                        {p.name}
                      </Link>
                    </p>
                    <p className="subtitle">{p.subtitle}</p>
                  </div>
                ))
              ) : (
                <p>{t("seminars.noSpeaker")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="boutton-section">
          <div className="card-actions">
            {isPast ? (
              <Link to={`/questionnaire`} className="reserve-button">
                {t("seminars.questionnaire")}
              </Link>
            ) : reservation ? (
              <button onClick={() => askDeleteReservation(reservation._id)} className="delete-button">
                {t("seminars.cancel")}
              </button>
            ) : (
              <Link to={`/reservation/${activity._id}`} className="reserve-button">
                {t("seminars.reserve")}
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
        <h1>{t("seminars.title")}</h1>
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
