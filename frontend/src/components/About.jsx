import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>Association des Économistes et Gestionnaires du Cameroun (AEGC)</h1>
        <p className="creation-date">Créée par note préfectorale de la Mefou Afamba N° 00053/RDA/JOS/SAAJP du 03 mars 2025</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Présentation</h2>
          <p>
            L'<strong>Association des Économistes et Gestionnaires du Cameroun (AEGC)</strong> est une organisation académique et professionnelle indépendante, fondée le 8 septembre 2021. Elle a pour vocation de structurer et de dynamiser la recherche scientifique en économie, en gestion et en politiques publiques au Cameroun, dans un esprit de rigueur, d'innovation et d'impact social.
          </p>
          <p>
            L'AEGC rassemble une communauté d'enseignants-chercheurs, doctorants, cadres, statisticiens, planificateurs et praticiens issus de différents horizons institutionnels, avec pour mission d'articuler la recherche scientifique avec les réalités du développement national.
          </p>
        </section>

        <section className="about-section">
          <h2>Missions et Activités</h2>
          <ul className="activities-list">
            <li>Valorisation des savoirs économiques à travers la recherche et la publication scientifique</li>
            <li>Organisation de conférences scientifiques et séminaires interuniversitaires</li>
            <li>Publication de revues à comité de lecture (<em>AEGC Review of Economics and Policy</em>, <em>Revue Camerounaise de Gestion</em>)</li>
            <li>Bourses d'encouragement à la recherche et formations certifiantes</li>
            <li>Développement d'indicateurs pour l'évaluation de la performance académique</li>
            <li>Collecte et analyse de données socioéconomiques via l'Unité d'Enquêtes et Statistiques</li>
            <li>Bibliothèque Numérique en libre accès</li>
            <li>Plateforme collaborative AEGC Connect</li>
          </ul>
        </section>

        <section className="contact-section">
          <h2>Contact</h2>
          <div className="contact-info">
            <p><strong>Téléphone:</strong> +237 697 88 17 82, +33 6 84 21 50 39, +237 655 17 67 94</p>
            <p><strong>Adresse:</strong> Cameroun, Boîte Postale Yaoundé</p>
            <p><strong>Email:</strong> <a href="mailto:aegc.237@gmail.com">aegc.237@gmail.com</a></p>
            <p><strong>LinkedIn:</strong> <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">Association des Économistes et Gestionnaires du Cameroun</a></p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;