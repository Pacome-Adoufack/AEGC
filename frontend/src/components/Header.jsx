import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Header.css";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa";
import { HiUser } from "react-icons/hi";
import { getAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "./Url";

import logo from "../assets/logo.png";

function Header({ isLoggedIn, setIsLoggedIn }) {
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
      return { label: 'Actif', className: 'membership-pill active' };
    }

    if (membershipStatus.status === 'expired') {
      return { label: 'Expiré', className: 'membership-pill expired' };
    }

    if (membershipStatus.status === 'pending') {
      return { label: 'En attente', className: 'membership-pill pending' };
    }

    // Do not show a 'Rejeté' badge in the header — it's confusing for users.

    // Ne pas afficher de badge pour les non-membres
    return null;
  };

  const membershipBadge = getMembershipBadge();

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
              aria-label="Fermer le menu"
            />
          ) : (
            <FaBars
              className="hamburger-icon"
              onClick={toggleMenu}
              aria-label="Ouvrir le menu"
            />
          )}
        </div>
        <div className={`header_nav ${isMenuOpen ? "open" : ""}`}>
          <nav className="nav_account">
            <ul className="nav_list">
              {!isLoggedIn ? (
                <>
                  <li>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      Créer un compte
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Se connecter
                    </Link>
                  </li>
                </>
              ) : null}
            </ul>
          </nav>

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
                      Dashboard {userRole === 'dev' ? 'Développeur' : userRole === 'dispatcher' ? 'Gestionnaire' : 'Administrateur'}
                    </Link>
                  </li>
                  {(userRole === 'admin' || userRole === 'dispatcher') && (
                    <li className="not-Dropdown">
                      <Link
                        to={
                          userRole === 'dispatcher'
                            ? '/dispatcher/working-papers'
                            : '/admin/working-papers'
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
                          Déconnexion
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
                      Accueil
                    </Link>
                  </li>

                  <li className="dropdown">
                    <button
                      className="dropdown-button"
                      onClick={() => toggleDropdown("activites")}
                    >
                      Journal
                    </button>
                    <div
                      className={`dropdown-menu ${openDropdown === "activites" ? "open" : ""
                        }`}
                    >
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        AEGC Review
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        AEGC Economic Review
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        Cameroon Economics Review
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        Management Review
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        Research
                      </Link>
                      <Link to="/development" onClick={() => setIsMenuOpen(false)}>
                        AEGC Metadata
                      </Link>
                    </div>
                  </li>

                  <li className="not-Dropdown">
                    <Link to="/working-papers" onClick={() => setIsMenuOpen(false)}>
                      Working Papers
                    </Link>
                  </li>

                  <li className="dropdown">
                    <button className="dropdown-button">Activités</button>
                    <div className="dropdown-menu">
                      <Link to="/seminaire" onClick={() => setIsMenuOpen(false)}>
                        AEGC Webinaire
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
                        AEGC Prix
                      </Link>
                      <Link to="/bourse" onClick={() => setIsMenuOpen(false)}>
                        AEGC Bourses
                      </Link>
                      <Link to="/images" onClick={() => setIsMenuOpen(false)}>
                        AEGC Photos
                      </Link>
                    </div>
                  </li>

                  <li className="not-Dropdown">
                    <Link to="/formations" onClick={() => setIsMenuOpen(false)}>
                      Formations
                    </Link>
                  </li>
                  <li className="dropdown">
                    <button className="dropdown-button">À propos</button>
                    <div className="dropdown-menu">
                      <Link to="/about" onClick={() => setIsMenuOpen(false)}>
                        A propos de nous
                      </Link>
                      {/* <Link to="/membres" onClick={() => setIsMenuOpen(false)}>
                  Les Membres
                </Link> */}
                      <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                        Nous contacter
                      </Link>
                      <Link to="/organigrame" onClick={() => setIsMenuOpen(false)}>
                        Organigramme
                      </Link>
                      <Link to="/ethique" onClick={() => setIsMenuOpen(false)}>
                        Éthique
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
                          Informations personnelles
                        </Link>
                        <Link
                          to="/my-submissions"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Mes Soumissions
                        </Link>
                        <Link
                          to="/status de facturation"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Status de facturation
                        </Link>
                        <Link
                          to="/appercu des Webinaires"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Appercu des Webinaires
                        </Link>
                        <Link
                          to="/appercu des formations"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Appercu des Formations
                        </Link>
                        <Link
                          to="/reference des communications"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Référence des Communications
                        </Link>
                        <Link
                          to="/forgotpassword"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Mot de passe oublié
                        </Link>
                        <button onClick={handleLogout} className="logout-button">
                          Déconnexion
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
        </div>
      </header>
    </>
  );
}

export default Header;
