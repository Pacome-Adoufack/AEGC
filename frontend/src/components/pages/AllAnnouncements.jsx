import React, { useEffect, useState } from "react";
import "../../styles/AllAnnouncements.css";
import { API_BASE_URL } from "../Url";

function formatDateDisplay(dateValue) {
  if (!dateValue) return null;
  const yyyyMmDd = /^\d{4}-\d{2}-\d{2}$/;
  let d;
  if (typeof dateValue === "string" && yyyyMmDd.test(dateValue)) {
    const [y, m, day] = dateValue.split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateValue);
  }
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const AllAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/announcements`);
        const result = await response.json();
        if (result.success) setAnnouncements(result.data || []);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openModal = (item) => {
    setModalItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalItem(null);
  };

  return (
    <div className="all-announcements-page">
      <div className="all-announcements-header">
        <h1>Actualités AEGC</h1>
        <p>Retrouvez toutes les actualités et communiqués de l'association</p>
      </div>

      <div className="all-announcements-container">
        {loading ? (
          <p className="ann-loading">Chargement…</p>
        ) : announcements.length === 0 ? (
          <p className="ann-empty">Aucune actualité pour le moment.</p>
        ) : (
          <div className="ann-grid">
            {announcements.map((item) => (
              <article
                key={item._id}
                className="ann-card"
                onClick={() => openModal(item)}
              >
                <div className="ann-card-meta">
                  <span className="ann-chip">{item.category}</span>
                  <span className="ann-date">
                    {formatDateDisplay(item.publishedAt || item.createdAt) || ""}
                  </span>
                </div>
                <h2 className="ann-card-title">{item.title}</h2>
                <p className="ann-card-summary">{item.summary}</p>
                <span className="ann-read-more">Lire la suite →</span>
              </article>
            ))}
          </div>
        )}
      </div>

      {modalOpen && modalItem && (
        <div
          className="ann-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ann-close" onClick={closeModal}>✕</button>
            <div className="ann-modal-content">
              <span className="ann-chip">{modalItem.category}</span>
              <h3 className="ann-modal-title">{modalItem.title}</h3>
              <p className="ann-modal-date">
                {formatDateDisplay(modalItem.publishedAt || modalItem.createdAt)}
              </p>
              {modalItem.expiresAt === null ? (
                <p className="ann-modal-expiry">Durée : À vie</p>
              ) : (
                <p className="ann-modal-expiry">
                  Valide jusqu'au : {formatDateDisplay(modalItem.expiresAt)}
                </p>
              )}
              <div className="ann-modal-body">
                {modalItem.content ? (
                  <div dangerouslySetInnerHTML={{ __html: modalItem.content }} />
                ) : (
                  <p>{modalItem.summary}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAnnouncements;
