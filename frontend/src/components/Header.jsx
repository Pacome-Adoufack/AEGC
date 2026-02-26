import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Header.css";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa";
import { HiUser } from "react-icons/hi";

import logo from "../assets/logo.png";

function Header({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || 'user';

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

  return (
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
            {(userRole === 'dev' || userRole === 'admin') ? (
              <>
                <li className="not-Dropdown">
                  <Link
                    to={userRole === 'dev' ? '/dev-dashboard' : '/admin-dashboard'}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: "inline-block",
                      transition: "transform 0.3s ease, color 0.3s ease",
                    }}
                  >
                    🎛️ Dashboard {userRole === 'dev' ? 'Développeur' : 'Administrateur'}
                    <span
                      style={{
                        display: "block",
                        height: "2px",
                        width: "0",
                        background: "#36bb6d",
                        transition: "width 0.3s ease",
                      }}
                    ></span>
                  </Link>
                </li>
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
                  <Link
                    to="/home"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: "inline-block",
                      transition: "transform 0.3s ease, color 0.3s ease",
                    }}
                  >
                    Accueil
                    <span
                      style={{
                        display: "block",
                        height: "2px",
                        width: "0",
                        background: "#36bb6d",
                        transition: "width 0.3s ease",
                      }}
                    ></span>
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
                      AEGC Papers and Processing
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
                  <Link
                    to="/development"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: "inline-block",
                      transition: "transform 0.3s ease, color 0.3s ease",
                    }}
                  >
                    Comités
                    <span
                      style={{
                        display: "block",
                        height: "2px",
                        width: "0",
                        background: "#36bb6d",
                        transition: "width 0.3s ease",
                      }}
                    ></span>
                  </Link>
                </li>
                <li className="not-Dropdown">
                  <Link
                    to="/formations"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: "inline-block",
                      transition: "transform 0.3s ease, color 0.3s ease",
                    }}
                  >
                    Formations
                    <span
                      style={{
                        display: "block",
                        height: "2px",
                        width: "0",
                        background: "#36bb6d",
                        transition: "width 0.3s ease",
                      }}
                    ></span>
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
  );
}

export default Header;
