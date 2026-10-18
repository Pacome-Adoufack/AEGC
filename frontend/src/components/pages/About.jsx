import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/About.css';

const About = () => {
  const { t } = useTranslation();
  const activities = t('about.activities', { returnObjects: true });

  return (
    <div className="about-container">
      <div className="about-header">
        <h1>{t('about.title')}</h1>
        <p className="creation-date">{t('about.creationDate')}</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>{t('about.presentation')}</h2>
          <p>{t('about.presentationFirst')}</p>
          <p>{t('about.presentationSecond')}</p>
        </section>

        <section className="about-section">
          <h2>{t('about.missions')}</h2>
          <ul className="activities-list">
            {activities.map((activity) => <li key={activity}>{activity}</li>)}
          </ul>
        </section>

        <section className="contact-section">
          <h2>{t('about.contact')}</h2>
          <div className="contact-info">
            <p><strong>{t('about.phone')}:</strong> +237 697 88 17 82, +33 6 84 21 50 39, +237 655 17 67 94</p>
            <p><strong>{t('about.address')}:</strong> Cameroun, Boîte Postale Yaoundé</p>
            <p><strong>{t('about.email')}:</strong> <a href="mailto:info@aegc-web.org">info@aegc-web.org</a></p>
            <p><strong>{t('about.linkedin')}:</strong> <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">{t('about.associationName')}</a></p>
          </div>
        </section>
      </div>

      <p className="about-dev-credit">
        {t('about.developedBy')}{' '}
        <a href="https://landry-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
          Landry Atikeng
        </a>
      </p>
    </div>
  );
};

export default About;
