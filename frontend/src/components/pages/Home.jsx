import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../../styles/Home.css";
import logo from "../../assets/logo.png";
import Seminar from "./Seminar";
import Release from "./Release";
import Images from "./Images";
import firstImage from "../../assets/firstImage.png";
import video from "../../assets/video.mp4";
import { API_BASE_URL } from "../Url";

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const videoRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const handlePlay = () => {
    setShowOverlay(true);
    setTimeout(() => {
      if (videoRef.current) videoRef.current.play();
    }, 100);
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowOverlay(false);
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/announcements?limit=7`);
        const result = await response.json();
        if (result.success) setAnnouncements(result.data || []);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();
  }, []);

  const featuredAnnouncement = announcements[0] || null;
  const otherAnnouncements = announcements.slice(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const openAnnouncementModal = (item) => {
    setModalItem(item);
    setModalOpen(true);
  };

  const closeAnnouncementModal = () => {
    setModalOpen(false);
    setModalItem(null);
  };

  return (
    <div className="home-page">

      {/* Hero */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${firstImage})` }}
      >
        <div className="hero-overlay">
          <img src={logo} alt="AEGC" className="hero-logo" />
          <p className="hero-tagline">
            Association des Économistes et Gestionnaires du Cameroun
          </p>
          <button className="hero-play-btn" onClick={handlePlay}>
            <span className="hero-play-icon">▶</span>
            Le Film AEGC
          </button>
        </div>
      </section>

      {showOverlay && (
        <div className="video-overlay" onClick={handleClose}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="video-close" onClick={handleClose}>✕</button>
            <video ref={videoRef} controls>
              <source src={video} type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      {/* Actualités + Séminaires côte à côte */}
      <section className="home-section bg-news">
        <div className="section-inner">

          {/* Header au-dessus des deux colonnes */}
          <div className="section-header">
            <h2>Actualités AEGC</h2>
            <Link to="/communiqué" className="section-link">Toutes les actualités →</Link>
          </div>

          <div className="dual-layout">

            {/* Colonne gauche : Actualités (prioritaire) */}
            <div className="news-column">

              {featuredAnnouncement ? (
                <>
                  <article className="news-featured">
                    <div className="news-meta">
                      <span className="announcement-chip">{featuredAnnouncement.category}</span>
                      <span className="announcement-date">
                        {new Date(featuredAnnouncement.publishedAt || featuredAnnouncement.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="news-featured-title">{featuredAnnouncement.title}</h3>
                    <p className="news-featured-summary">{featuredAnnouncement.summary}</p>
                    <button
                      type="button"
                      className="news-read-more"
                      onClick={() => openAnnouncementModal(featuredAnnouncement)}
                    >
                      Lire la suite →
                    </button>
                  </article>

                  {otherAnnouncements.length > 0 && (
                    <div className="news-cards-grid">
                      {otherAnnouncements.map((item) => (
                        <article key={item._id} className="news-card" onClick={() => openAnnouncementModal(item)} style={{ cursor: 'pointer' }}>
                          <div className="news-meta">
                            <span className="announcement-chip">{item.category}</span>
                            <span className="announcement-date">
                              {new Date(item.publishedAt || item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <h4 className="news-card-title">{item.title}</h4>
                          <p className="news-card-summary">{item.summary}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="no-content-msg">Aucune actualité pour le moment.</p>
              )}
            </div>

            {/* Colonne droite : Séminaires */}
            <aside className="seminar-sidebar">
              <h2 className="sidebar-title">Prochains Séminaires</h2>
              <div className="seminar-sidebar-inner">
                <Seminar />
              </div>
            </aside>

          </div>{/* fin dual-layout */}
        </div>
      </section>

      {/* Modal pour afficher les détails d'une annonce */}
      {modalOpen && modalItem && (
        <div className="announcement-overlay" onClick={closeAnnouncementModal} role="dialog" aria-modal="true">
          <div className="announcement-modal" onClick={(e) => e.stopPropagation()}>
            <button className="announcement-close" onClick={closeAnnouncementModal}>✕</button>
            <div className="announcement-content">
              <h3 className="announcement-title">{modalItem.title}</h3>
              <p className="announcement-meta">{new Date(modalItem.publishedAt || modalItem.createdAt).toLocaleDateString('fr-FR')}</p>
              <div className="announcement-body">
                {modalItem.content ? <div dangerouslySetInnerHTML={{ __html: modalItem.content }} /> : <p>{modalItem.summary}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Communiqués */}
      <section className="home-section bg-white">
        <Release />
      </section>

      {/* Galerie — loin en bas */}
      <section className="home-section bg-light-gray">
        <Images />
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <h2>Restez informé-e</h2>
          <p>Recevez des articles exclusifs sur l'actualité économique.</p>
          <a href="/subscribe" className="newsletter-btn">S'abonner</a>
        </div>
      </section>

    </div>
  );
};

export default Home;
