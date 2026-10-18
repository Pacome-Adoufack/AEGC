import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/Header.css";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa";
import { HiUser } from "react-icons/hi";
import { getAuthHeaders } from "@/utils/auth";
import { API_BASE_URL } from "../Url";

import logo from "@/assets/logo.png";

function Header({ isLoggedIn, setIsLoggedIn }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || 'user';

  useEffect(() => {
    const loadMembershipStatus = async () => {
      if (!isLoggedIn || userRole !== 'user') {
        setMembershipStatus(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/membership/my-membership`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data?.membership) {
          const statusField = data.membership.submissionStatus || data.membership.paymentStatus;
          let status = 'none';
          if (statusField === 'pending') status = 'pending';
          else if (statusField === 'rejected' || statusField === 'cancelled') status = 'rejected';
          else if (statusField === 'approved') status = data.isActive ? 'active' : 'expired';
          else status = data.isActive ? 'active' : 'none';

          setMembershipStatus({ status, endDate: data.membership.endDate });
        } else {
          setMembershipStatus({ status: 'none', endDate: null });
        }
      } catch (error) {
        console.error('Erreur chargement statut membership:', error);
        setMembershipStatus(null);
      }
    };

    loadMembershipStatus();
  }, [isLoggedIn, userRole]);

  const toggleDropdown = (name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("userRole");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate('/', { replace: true });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getMembershipBadge = () => {
    if (!membershipStatus) return null;

    if (membershipStatus.status === 'active') {
      return { label: t('header.membership.active'), className: 'membership-pill active' };
    }

    if (membershipStatus.status === 'expired') {
      return { label: t('header.membership.expired'), className: 'membership-pill expired' };
    }

    if (membershipStatus.status === 'pending') {
      return { label: t('header.membership.pending'), className: 'membership-pill pending' };
    }

    // Do not show a 'Rejeté' badge in the header — it's confusing for users.

    // Ne pas afficher de badge pour les non-membres
    return null;
  };

  const _membershipBadge = getMembershipBadge();
  const roleLabel = userRole === 'dev'
    ? t('header.dashboard.developer')
    : userRole === 'dispatcher'
      ? t('header.dashboard.manager')
      : t('header.dashboard.administrator');

  return (
    <>
      {/* Backdrop mobile hors du header pour éviter le stacking context */}
      {isMenuOpen && (
        <div
          className="nav-backdrop"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}
      <header className="header">
        <div className="logo-container">
          <img className="logo" src={logo} alt="Logo" />
        </div>

        <div className="hamburger">
          {isMenuOpen ? (
            <FaTimes
              className="hamburger-icon"
              onClick={toggleMenu}
              aria-label={t('header.closeMenu')}
            />
          ) : (
            <FaBars
              className="hamburger-icon"
              onClick={toggleMenu}
              aria-label={t('header.openMenu')}
            />
          )}
        </div>
        <div className={`header_nav ${isMenuOpen ? "open" : ""}`}>
          {/* Liens de compte : à droite du menu sur ordinateur (voir .nav_account),
              en tête du panneau sur mobile. Absents une fois connecté. */}
          {!isLoggedIn && (
            <nav className="nav_account" aria-label={t('header.account')}>
              <ul className="nav_list">
                <li>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    {t('header.login')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="nav-cta" onClick={() => setIsMenuOpen(false)}>
                    {t('header.register')}
                  </Link>
                </li>
              </ul>
            </nav>
          )}

          <nav className="nav_main">
            <ul className="nav_list">
              {/* Menu pour DEV et ADMIN - Dashboard simplifié */}
              {(userRole === 'dev' || userRole === 'admin' || userRole === 'dispatcher') ? (
                <>
                  <li className="not-Dropdown">
                    <Link
                      to={
                        userRole === 'dev'
                          ? '/dev-dashboard'
                          : userRole === 'dispatcher'
                            ? '/dispatcher/working-papers'
                            : '/admin-dashboard'
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard {roleLabel}
                    </Link>
                  </li>
                  {(userRole === 'admin' || userRole === 'dispatcher') && (
                    <li className="not-Dropdown">
                      <Link
                        to={
                          userRole === 'dispatcher'
                            ? '/dispatcher/working-papers'
                            : '/admin-dashboard?section=working-papers'
                        }
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Working Papers
                      </Link>
                    </li>
                  )}
                  {isLoggedIn && (
                    <li className="dropdown">
                      <button className="dropdown-button">
                        <HiUser size={20} />
                        <span className="user">{storedUser?.firstName} ({userRole.toUpperCase()})</span>
                      </button>
                      <div className="dropdown-menu">
                        <button onClick={handleLogout} className="logout-button">
                          {t('header.logout')}
                        </button>
                      </div>
                    </li>
                  )}
                </>
              ) : (
                /* Menu normal pour USER */
                <>
                  <li className="not-Dropdown">
                    <Link to="/home" onClick={() => setIsMenuOpen(false)}>
                      {t('header.home')}
                    </Link>
                  </li>

                  <li className="dropdown">
                    <button
                      className="dropdown-button"
                      onClick={() => toggleDropdown("activites")}
                    >
                      {t('header.journal')}
                    </button>
                    <div
                      className={`dropdown-menu ${openDropdown === "activites" ? "open" : ""
                        }`}
                    >
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        {t('header.journalItems.aegcReview')}
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        {t('header.journalItems.aegcEconomicReview')}
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        {t('header.journalItems.cameroonEconomicsReview')}
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        {t('header.journalItems.managementReview')}
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        {t('header.journalItems.research')}
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        {t('header.journalItems.metadata')}
                      </Link>
                    </div>
                  </li>

                  <li className="not-Dropdown">
                    <Link to="/working-papers" onClick={() => setIsMenuOpen(false)}>
                      {t('header.workingPapers')}
                    </Link>
                  </li>

                  <li className="dropdown">
                    <button className="dropdown-button">{t('header.activities')}</button>
                    <div className="dropdown-menu">
                      <Link to="/seminaire" onClick={() => setIsMenuOpen(false)}>
                        {t('header.webinar')}
                      </Link>
                      {/* <Link to="/seminaire" onClick={() => setIsMenuOpen(false)}>
                  AEGC Séminaire
                </Link> */}
                      {/* <Link
                  to="/activity/conference"
                  onClick={() => setIsMenuOpen(false)}
                >
                  AEGC Conférence
                </Link> */}
                      <Link to="/price" onClick={() => setIsMenuOpen(false)}>
                        {t('header.award')}
                      </Link>
                      <Link to="/bourse" onClick={() => setIsMenuOpen(false)}>
                        {t('header.scholarships')}
                      </Link>
                      <Link to="/picture" onClick={() => setIsMenuOpen(false)}>
                        {t('header.photos')}
                      </Link>
                    </div>
                  </li>

                  <li className="not-Dropdown">
                    <Link to="/formations" onClick={() => setIsMenuOpen(false)}>
                      {t('header.formations')}
                    </Link>
                  </li>
                  <li className="dropdown">
                    <button className="dropdown-button">{t('header.about')}</button>
                    <div className="dropdown-menu">
                      <Link to="/about" onClick={() => setIsMenuOpen(false)}>
                        {t('header.aboutUs')}
                      </Link>
                      {/* <Link to="/membres" onClick={() => setIsMenuOpen(false)}>
                  Les Membres
                </Link> */}
                      <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                        {t('header.contactUs')}
                      </Link>
                      <Link to="/organigrame" onClick={() => setIsMenuOpen(false)}>
                        {t('header.organization')}
                      </Link>
                      <Link to="/ethique" onClick={() => setIsMenuOpen(false)}>
                        {t('header.ethics')}
                      </Link>
                    </div>
                  </li>
                  {isLoggedIn && (
                    <li className="dropdown">
                      <button className="dropdown-button">
                        <HiUser size={20} />
                        <span className="user">{storedUser?.firstName}</span>
                      </button>
                      <div className="dropdown-menu">
                        <Link
                          to="/informations personnelles"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.personalInformation')}
                        </Link>
                        <Link
                          to="/my-submissions"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.submissions')}
                        </Link>
                        <Link
                          to="/status de facturation"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.billingStatus')}
                        </Link>
                        <Link
                          to="/appercu des Webinaires"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.webinarsOverview')}
                        </Link>
                        <Link
                          to="/appercu des formations"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.formationsOverview')}
                        </Link>
                        <Link
                          to="/reference des communications"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.communicationsReference')}
                        </Link>
                        <Link
                          to="/forgotpassword"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t('header.forgotPassword')}
                        </Link>
                        <button onClick={handleLogout} className="logout-button">
                          {t('header.logout')}
                        </button>
                      </div>
                    </li>
                  )}
                  {/* <li>
              <Link
                to="/userprofile"
                onClick={() => setIsMenuOpen(false)}
              >
                <HiUser size={30} />
              </Link>
            </li> */}
                </>
              )}
            </ul>
          </nav>

          <div className="language-switcher">
            <span aria-hidden="true">🌐</span>
            <button
              type="button"
              className="language-toggle"
              aria-label={i18n.resolvedLanguage?.startsWith('en') ? t('header.switchToFrench') : t('header.switchToEnglish')}
              onClick={() => i18n.changeLanguage(i18n.resolvedLanguage?.startsWith('en') ? 'fr' : 'en')}
            >
              {i18n.resolvedLanguage?.startsWith('en') ? 'EN' : 'FR'}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
