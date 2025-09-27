import React from "react";
import "../styles/Footer.css";
import logo from "../assets/logo.png"; 

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <section>
          <img
            src={logo}
            alt="logo"
          />
          <a href="/contact">Nous contacter</a>
        </section>
        <section>
          <h2>AEGC</h2>
          <ul>
            <li><a href="/home">Accueil</a></li>
            <li><a href="/journal view">Journaux</a></li>
            <li><a href="/activity">Activités</a></li>
            <li><a href="/committees">Comités</a></li>
            <li><a href="/about">À propos</a></li>
            <li><a href="/research">Recherche</a></li>
          </ul>
        </section>
        <section>
          <h2>Liens utiles</h2>
          <ul>
          <li><a href="/communiqué">Nos communiqué</a></li>
          <li><a href="/questionnaire">Questionnaire</a></li>
            <li><a href="/register">Créer un compte</a></li>
            <li><a href="/login">Se connecter</a></li>
            <li><a href="/forgotpassword">Mot de passe oublié</a></li>
            <li><a href="/passwort-reset/:token">Réinitialiser le mot de passe</a></li>
          </ul>
        </section>
        <section>
          <h2>Suivez-nous</h2>
          <ul className="social-links">
            <li><a href="https://whatsapp.com/channel/0029VaiK9Uh9MF98zYaAId36" target="_blank" rel="noopener noreferrer">Whatsapp</a></li>
            <li><a href="https://www.linkedin.com/company/association-des-economistes-et-gestionnaires-du-cameroun/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href="" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="" target="_blank" rel="noopener noreferrer">X</a></li>
          </ul>
        </section>
      </div>

      <hr className="footer-separator" />

      <div className="footer-bottom">
        <p className="footer_copy">
          &copy; {new Date().getFullYear()} AEGC. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
