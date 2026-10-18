import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/AllAnnouncements.css";
import { API_BASE_URL } from "../Url";
import AnnouncementBody from "../common/AnnouncementBody";
import {
  attachmentUrl,
  categoryLabel,
  firstImageAttachment,
  hasMoreToRead,
} from "../../utils/announcements";

function formatDateDisplay(dateValue, language = "fr") {
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
  return d.toLocaleDateString(language === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const AllAnnouncements = () => {
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/announcements?limit=20`);
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
        <h1>{t("announcements.title")}</h1>
        <p>{t("announcements.subtitle")}</p>
      </div>

      <div className="all-announcements-container">
        {loading ? (
          <p className="ann-loading">{t("announcements.loading")}</p>
        ) : announcements.length === 0 ? (
          <p className="ann-empty">{t("announcements.empty")}</p>
        ) : (
          <div className="ann-grid">
            {announcements.map((item) => {
              const readable = hasMoreToRead(item);
              const cover = firstImageAttachment(item);
              const pdfCount = (item.attachments || []).filter((a) => a.kind === "pdf").length;
              return (
                <article
                  key={item._id}
                  className={`ann-card ${readable ? "" : "ann-card--static"} ${cover ? "ann-card--with-cover" : ""}`}
                  onClick={readable ? () => openModal(item) : undefined}
                >
                  {cover && (
                    <div className="ann-card-cover">
                      <img src={attachmentUrl(cover)} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="ann-card-body">
                    <div className="ann-card-meta">
                      <span className="ann-chip">{categoryLabel(item.category)}</span>
                      <span className="ann-date">
                        {formatDateDisplay(item.publishedAt || item.createdAt, i18n.language) || ""}
                      </span>
                    </div>
                    <h2 className="ann-card-title">{item.title}</h2>
                    <p className="ann-card-summary">{item.summary}</p>
                    {readable && (
                      <span className="ann-read-more">
                        {pdfCount > 0 ? t("announcements.readMorePdf", { count: pdfCount }) : t("announcements.readMore")}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
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
              <span className="ann-chip">{categoryLabel(modalItem.category)}</span>
              <h3 className="ann-modal-title">{modalItem.title}</h3>
              <p className="ann-modal-date">
                {formatDateDisplay(modalItem.publishedAt || modalItem.createdAt, i18n.language)}
              </p>
              {modalItem.expiresAt === null ? (
                <p className="ann-modal-expiry">{t("announcements.lifetime")}</p>
              ) : (
                <p className="ann-modal-expiry">
                  {t("announcements.validUntil", { date: formatDateDisplay(modalItem.expiresAt, i18n.language) })}
                </p>
              )}
              <div className="ann-modal-body">
                <AnnouncementBody announcement={modalItem} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAnnouncements;
