import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";

const formatDeadline = (date) =>
  new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// « L'AEGC en bref » : qui est l'association, en faits vérifiables (page À propos),
// et l'appel à contributions en cours s'il y en a un.
export default function HomeIntro() {
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

  return (
    <section className="home-intro" aria-labelledby="home-intro-title">
      <div className="home-intro-inner">
        <div className="home-intro-text">
          <h2 id="home-intro-title">Une association de recherche en économie et en gestion</h2>
          <p>
            L'AEGC rassemble enseignants-chercheurs, doctorants, cadres et praticiens pour
            structurer la recherche en économie, en gestion et en politiques publiques au Cameroun.
          </p>
          <Link to="/about" className="home-intro-link">Découvrir l'association →</Link>
        </div>

        <div className="home-intro-side">
          <dl className="home-facts">
            <div>
              <dt>2021</dt>
              <dd>Fondation de l'association, le 8 septembre</dd>
            </div>
            <div>
              <dt>2 revues</dt>
              <dd>
                À comité de lecture : <cite>AEGC Review of Economics and Policy</cite> et{" "}
                <cite>Revue Camerounaise de Gestion</cite>
              </dd>
            </div>
          </dl>

          {openCall ? (
            <div className="home-call">
              <p className="home-call-label">Appel à contributions ouvert</p>
              <p className="home-call-title">{openCall.title}</p>
              <p className="home-call-deadline">Date limite : {formatDeadline(openCall.deadline)}</p>
              <Link to={`/working-papers/${openCall._id}`} className="home-call-cta">
                Soumettre un article
              </Link>
            </div>
          ) : (
            <div className="home-call home-call--quiet">
              <p className="home-call-title">Série Working Papers</p>
              <p className="home-call-deadline">Les travaux de recherche soumis et évalués par l'AEGC.</p>
              <Link to="/working-papers" className="home-intro-link">Consulter la série →</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
