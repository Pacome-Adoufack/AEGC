import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../../styles/Home.css";
import Seminar from "./Seminar";
import HeroMosaic from "./HeroMosaic";
import video from "../../assets/video.mp4";
import { API_BASE_URL } from "../Url";
import AnnouncementBody from "../common/AnnouncementBody";
import HomeGallery from "./HomeGallery";
import HomeIntro from "./HomeIntro";
import HomeAwards from "../awards/HomeAwards";
import {
  attachmentUrl,
  categoryLabel,
  firstImageAttachment,
  hasMoreToRead,
} from "../../utils/announcements";

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  // La colonne séminaires ne s'affiche que s'il y a un séminaire à venir.
  const [hasSeminars, setHasSeminars] = useState(false);
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
  // Trois cartes seulement : une ligne nette, et chacune assez large pour être
  // lisible. Le reste est derrière « Toutes les actualités ».
  const otherAnnouncements = announcements.slice(1, 4);
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

      {/* Hero : message à gauche, photo à droite */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <p className="hero-kicker">Association académique et professionnelle, fondée en 2021</p>
            <h1 className="hero-title">
              Le réseau des économistes et gestionnaires du Cameroun
            </h1>
            <p className="hero-subtitle">
              Rejoignez une communauté d'experts engagés pour le développement économique et la recherche en gestion.
            </p>
            <div className="hero-ctas">
              <Link to="/membership/payment" className="hero-cta-primary">
                Devenir membre
              </Link>
              <button type="button" className="hero-play-btn" onClick={handlePlay}>
                <span className="hero-play-icon" aria-hidden="true">▶</span>
                Voir le film
              </button>
            </div>
          </div>
          <HeroMosaic />
        </div>
      </section>

      <HomeIntro />

      {/* Ne rend rien tant qu'aucun lauréat n'est publié pour l'année en cours. */}
      <HomeAwards />

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
            <Link to="/actualites" className="section-link">Toutes les actualités →</Link>
          </div>

          <div className={hasSeminars ? "dual-layout" : "dual-layout dual-layout--single"}>

            {/* Colonne gauche : Actualités (prioritaire) */}
            <div className="news-column">

              {featuredAnnouncement ? (
                <>
                  <article className="news-featured">
                    {firstImageAttachment(featuredAnnouncement) && (
                      <div className="news-featured-cover">
                        <img src={attachmentUrl(firstImageAttachment(featuredAnnouncement))} alt="" loading="lazy" />
                      </div>
                    )}
                    <div className="news-meta">
                      <span className="announcement-chip">{categoryLabel(featuredAnnouncement.category)}</span>
                      <span className="announcement-date">
                        {new Date(featuredAnnouncement.publishedAt || featuredAnnouncement.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="news-featured-title">{featuredAnnouncement.title}</h3>
                    <p className="news-featured-summary">{featuredAnnouncement.summary}</p>
                    {hasMoreToRead(featuredAnnouncement) && (
                      <button
                        type="button"
                        className="news-read-more"
                        onClick={() => openAnnouncementModal(featuredAnnouncement)}
                      >
                        Lire la suite →
                      </button>
                    )}
                  </article>

                  {otherAnnouncements.length > 0 && (
                    <div className="news-cards-grid">
                      {otherAnnouncements.map((item) => {
                        const readable = hasMoreToRead(item);
                        const pdfCount = (item.attachments || []).filter((a) => a.kind === "pdf").length;

                        // Un vrai bouton quand la carte ouvre quelque chose :
                        // l'<article> cliquable d'avant était inatteignable au
                        // clavier, et rien n'indiquait qu'on pouvait cliquer.
                        const Tag = readable ? "button" : "article";

                        return (
                          <Tag
                            key={item._id}
                            type={readable ? "button" : undefined}
                            className={`news-card${readable ? "" : " news-card--static"}`}
                            onClick={readable ? () => openAnnouncementModal(item) : undefined}
                          >
                            <div className="news-meta">
                              <span className="announcement-chip">{categoryLabel(item.category)}</span>
                              <span className="announcement-date">
                                {new Date(item.publishedAt || item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <h4 className="news-card-title">{item.title}</h4>
                            <p className="news-card-summary">{item.summary}</p>
                            {readable && (
                              <span className="news-card-more">
                                {pdfCount > 0 ? `Lire la suite · ${pdfCount} PDF →` : "Lire la suite →"}
                              </span>
                            )}
                          </Tag>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="no-content-msg">Aucune actualité pour le moment.</p>
              )}
            </div>

            {/* Colonne droite : Séminaires */}
            {/* Toujours monté pour charger les séminaires, mais masqué s'il n'y en a
                aucun à venir : pas de bloc vide sur la page d'accueil. */}
            <aside className="seminar-sidebar" hidden={!hasSeminars}>
              <h2 className="sidebar-title">Prochains séminaires</h2>
              <div className="seminar-sidebar-inner">
                <Seminar onAvailabilityChange={setHasSeminars} />
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
                <AnnouncementBody announcement={modalItem} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Galerie photos (masquée tant qu'aucune photo n'est publiée) */}
      <HomeGallery />

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <h2>Restez informé-e</h2>
          <p>Recevez les annonces, les appels à contributions et les événements de l'AEGC.</p>
          <Link to="/subscribe" className="newsletter-btn">S'abonner</Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
