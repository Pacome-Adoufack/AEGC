import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";

// « L'AEGC en bref » : qui est l'association, en faits vérifiables (page À propos),
// et l'appel à contributions en cours s'il y en a un.
export default function HomeIntro() {
  const { t, i18n } = useTranslation();
  const [openCall, setOpenCall] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/working-papers`)
      .then((res) => (res.ok ? res.json() : []))
      .then((calls) => {
        if (!Array.isArray(calls)) return;
        const now = Date.now();
        // L'appel ouvert dont l'échéance est la plus proche
        const next = calls
          .filter((wp) => wp.status === "ouvert" && new Date(wp.deadline).getTime() >= now)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
        setOpenCall(next || null);
      })
      .catch(() => setOpenCall(null));
  }, []);

  const formatLocalizedDeadline = (date) => new Date(date).toLocaleDateString(
    i18n.language === "en" ? "en-US" : "fr-FR",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <section className="home-intro" aria-labelledby="home-intro-title">
      <div className="home-intro-inner">
        <div className="home-intro-text">
          <h2 id="home-intro-title">{t("home.intro.title")}</h2>
          <p>{t("home.intro.body")}</p>
          <Link to="/about" className="home-intro-link">{t("home.intro.discover")}</Link>
        </div>

        <div className="home-intro-side">
          <dl className="home-facts">
            <div>
              <dt>2021</dt>
              <dd>{t("home.intro.founded")}</dd>
            </div>
            <div>
              <dt>{t("home.intro.reviews")}</dt>
              <dd>{t("home.intro.reviewsDescription")}</dd>
            </div>
          </dl>

          {openCall ? (
            <div className="home-call">
              <p className="home-call-label">{t("home.intro.openCall")}</p>
              <p className="home-call-title">{openCall.title}</p>
              <p className="home-call-deadline">{t("home.intro.deadline", { date: formatLocalizedDeadline(openCall.deadline) })}</p>
              <Link to={`/working-papers/${openCall._id}`} className="home-call-cta">
                {t("home.intro.submit")}
              </Link>
            </div>
          ) : (
            <div className="home-call home-call--quiet">
              <p className="home-call-title">{t("home.intro.series")}</p>
              <p className="home-call-deadline">{t("home.intro.seriesDescription")}</p>
              <Link to="/working-papers" className="home-intro-link">{t("home.intro.viewSeries")}</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
