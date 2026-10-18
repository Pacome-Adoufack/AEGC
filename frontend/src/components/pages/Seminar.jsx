import React, { useEffect, useState } from "react";
import "../../styles/Seminar.css";
import { FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import logo1 from "../../assets/logo1.png";
import ConfirmDialog from "../common/ConfirmDialog";
import { useTranslation } from "react-i18next";

// onAvailabilityChange(bool) : prévient la page hôte s'il y a des séminaires à
// afficher, pour qu'elle masque la colonne au lieu d'y montrer un bloc vide.
const Seminar = ({ onAvailabilityChange }) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(new Date());
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const openConfirm = ({ title, message, onConfirm, type = 'danger' }) => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type });
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getCountdown = (targetDate) => {
    const diff = new Date(targetDate) - now;
    if (diff <= 0) return t("seminars.finished");
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${days}${t("seminars.days")} ${hours}${t("seminars.hours")} ${minutes}${t("seminars.minutes")} ${seconds}${t("seminars.seconds")}`;
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/activities`);
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      } catch {
        setLoadError(t("seminars.loadError"));
      } finally {
        setLoaded(true);
      }
    };
    fetchActivities();
  }, [t]);

  useEffect(() => {
    const fetchReservations = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/reservation`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setReservations(data);
      } catch {
        // ne pas afficher d'erreur bloquante pour les réservations
      }
    };
    fetchReservations();
  }, []);

  const handleDeleteReservation = async (Id) => {
    try {
      await fetch(`${API_BASE_URL}/reservation/${Id}`, { method: "DELETE" });
      setReservations((prev) => prev.filter((r) => r._id.toString() !== Id.toString()));
    } catch {
      // silencieux
    }
  };

  const askDeleteReservation = (Id) => {
    openConfirm({
      title: t("seminars.cancelTitle"),
      message: t("seminars.cancelConfirm"),
      onConfirm: () => handleDeleteReservation(Id),
    });
  };

  const scrollGallery = (direction) => {
    const container = document.getElementById("scroll-gallery");
    if (container) {
      container.scrollBy({ left: direction === "left" ? -340 : 340, behavior: "smooth" });
    }
  };

  // Ne montrer que les activités pas encore disparues (< 7 jours après l'événement)
  const visibleActivities = activities.filter((activity) => {
    const oneWeekAfter = new Date(new Date(activity.date).getTime() + 7 * 24 * 60 * 60 * 1000);
    return now <= oneWeekAfter;
  });

  const hasActivities = visibleActivities.length > 0;
  useEffect(() => {
    if (loaded) onAvailabilityChange?.(hasActivities);
  }, [loaded, hasActivities, onAvailabilityChange]);

  return (
    <>
      <div className="meeting-container">
        <div className="meeting-content">
          <h1>{t("seminars.title")}</h1>

          {loadError && <p className="seminar-error">{loadError}</p>}

          <div className="scroll-controls">
            <button className="arrow-button left" onClick={() => scrollGallery("left")}>
              <FaArrowLeft />
            </button>

            <div id="scroll-gallery" className="activity-scroll-container">
              {visibleActivities.length === 0 ? (
                <p className="no-seminar-msg">{t("seminars.noUpcoming")}</p>
              ) : (
                visibleActivities.map((activity) => {
                  const seminarDate = new Date(activity.date);
                  const oneWeekAfter = new Date(seminarDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                  const isPast = seminarDate < now;

                  const reservation = reservations.find((r) => {
                    const rId = typeof r.activity === "object" ? r.activity._id : r.activity;
                    return String(rId) === String(activity._id);
                  });

                  return (
                    <div key={activity._id} className="activity-card">
                      <div className="countdown-container">
                        <p className="countdown">
                          ⏳ {t("seminars.startsIn")} <span>{getCountdown(activity.date)}</span>
                        </p>
                        <img src={logo1} alt={t("seminars.logoAlt")} className="logo1" />
                        <p className="countdown-small">
                          {t("seminars.disappearsIn")} <span>{getCountdown(oneWeekAfter)}</span>
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
                          <p className="activity-timezone">🕑 {t("seminars.paris")} {activity.timeParis}</p>
                          <div className="divider"></div>
                          <p className="activity-timezone">🕑 {t("seminars.yaounde")} {activity.timeYaounde}</p>
                        </div>

                        <div className="activity-info">
                          <div className="moderator">
                            {activity.moderators && activity.moderators.length > 0 ? (
                              activity.moderators.map((m, index) => (
                                <div key={index}>
                                  <p>
                                    <strong>{t("seminars.moderator")}</strong>{" "}
                                    <Link className="doctor-link" to={`/speaker/${activity.presenterId}`}>
                                      {m.name}
                                    </Link>
                                  </p>
                                  <p className="subtitle">{m.subtitle}</p>
                                </div>
                              ))
                            ) : (
                              <p>{t("seminars.noModerator")}</p>
                            )}
                          </div>
                          <div className="participant-card">
                            {activity.participants && activity.participants.length > 0 ? (
                              activity.participants.map((p, index) => (
                                <div key={index}>
                                  <p>
                                    <strong>{t("seminars.speaker")}</strong>{" "}
                                    <Link className="doctor-link" to={`/speaker/${activity.presenterId}`}>
                                      {p.name}
                                    </Link>
                                  </p>
                                  <p className="subtitle">{p.subtitle}</p>
                                </div>
                              ))
                            ) : (
                              <p>{t("seminars.noSpeakerWebinar")}</p>
                            )}
                          </div>
                        </div>

                        <div className="card-actions">
                          {isPast ? (
                            <Link to="/questionnaire" className="reserve-button">{t("seminars.questionnaire")}</Link>
                          ) : reservation ? (
                            <button onClick={() => askDeleteReservation(reservation._id)} className="delete-button">
                              {t("seminars.cancel")}
                            </button>
                          ) : (
                            <Link to={`/reservation/${activity._id}`} className="reserve-button">{t("seminars.reserve")}</Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button className="arrow-button right" onClick={() => scrollGallery("right")}>
              <FaArrowRight />
            </button>
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
        </div>
      </div>
    </>
  );
};

export default Seminar;
