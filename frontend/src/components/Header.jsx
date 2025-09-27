import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa";
import logo from "../assets/logo.png";

function Header({ isLoggedIn, setIsLoggedIn }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

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
    setIsLoggedIn(false);
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
            ) : (
              <li>
                <button onClick={handleLogout} className="logout-button">
                  Déconnexion
                </button>
              </li>
            )}
          </ul>
        </nav>

        <nav className="nav_main">
          <ul className="nav_list">
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
              <div className={`dropdown-menu ${openDropdown === "activites" ? "open" : ""}`}>
                <Link to="/review" onClick={() => setIsMenuOpen(false)}>
                  AEGC Review
                </Link>
                <Link to="/journal/papers" onClick={() => setIsMenuOpen(false)}>
                  AEGC Papers and Processing
                </Link>
                <Link
                  to="/journal/economic"
                  onClick={() => setIsMenuOpen(false)}
                >
                  AEGC Economic Review
                </Link>
                <Link
                  to="/journal/management"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Management Review
                </Link>
                <Link
                  to="/journal/research"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Research
                </Link>
                <Link
                  to="/journal/metadata"
                  onClick={() => setIsMenuOpen(false)}
                >
                  AEGC Metadata
                </Link>
              </div>
            </li>

            <li className="dropdown">
              <button className="dropdown-button">Activités</button>
              <div className="dropdown-menu">
                <Link to="/seminaire" onClick={() => setIsMenuOpen(false)}>
                  AEGC Séminaire
                </Link>
                <Link
                  to="/activity/conference"
                  onClick={() => setIsMenuOpen(false)}
                >
                  AEGC Conférence
                </Link>
                <Link to="/images" onClick={() => setIsMenuOpen(false)}>
                  AEGC Photos
                </Link>
                <Link
                  to="/activity/webinaire"
                  onClick={() => setIsMenuOpen(false)}
                >
                  AEGC Webinaire
                </Link>
              </div>
            </li>

            <li className="not-Dropdown">
              <Link
                to="a"
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

            <li className="dropdown">
              <button className="dropdown-button">À propos</button>
              <div className="dropdown-menu">
                <Link to="/about" onClick={() => setIsMenuOpen(false)}>
                  A propos de nous
                </Link>
                <Link to="/membres" onClick={() => setIsMenuOpen(false)}>
                  Les Membres
                </Link>
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
            <li className="not-Dropdown">
              <Link
                to="/home"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: "inline-block",
                  transition: "transform 0.3s ease, color 0.3s ease",
                }}
              >
                <FaSearch />
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
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
