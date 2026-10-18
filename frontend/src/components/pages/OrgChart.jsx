import React from "react";
import "../../styles/OrgChart.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const OrgChart = () => {
  const { t } = useTranslation();
  return (
    <div className="organigramme-container">
      <div className="org-header">
        <h1>{t("organization.title")}</h1>
      </div>

      <div className="org-tree">
        {/* Niveau 1 - Président */}
        <Link to="/president" className="link">
          <div className="org-level">
            <div className="org-node">
              <div className="org-title">{t("organization.president")}</div>
              <div className="org-name">Aristide Merlin Ngono </div>
              <div className="org-titel">PhD en Economie de la santé </div>
            </div>
          </div>
        </Link>

        {/* Niveau 2 - Vice-Président et Secrétaire Général */}

        <div className="org-level">
          <Link to="/vice president" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.vicePresident")}</div>
              <div className="org-name">Daave Franklin MVOGO II OSSEDE</div>
              <div className="org-titel">
                PhD en analyse de politiques économiques{" "}
              </div>
            </div>
          </Link>
          <Link to="/secretaire general" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.secretaryGeneral")}</div>
              <div className="org-name">Blaise BEYENE ONDOUA </div>
              <div className="org-titel">PhD en Economie mathématique </div>
            </div>
          </Link>
        </div>

        {/* Niveau 3 - Autres postes */}

        <div className="org-level">
          <Link to="/tresorier" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.treasurer")}</div>
              <div className="org-name">Inès Pérolde ZEH</div>
              <div className="org-titel">
                PhD en économie des ressources humaines
              </div>
            </div>
          </Link>
          <Link to="/responsable GRH" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.hrManager")}</div>
              <div className="org-name">Cyril Pierre Kinfack </div>
              <div className="org-titel">
                PHD(s) en Sciences et techniques de Gestion{" "}
              </div>
            </div>
          </Link>
          <Link to="/relations exterieures" className="link">
            <div className="org-node">
              <div className="org-title">
                {t("organization.externalRelations")}
              </div>
              <div className="org-name">Marius Parfait Tebou Tedong </div>
              <div className="org-titel">
                Pricing actuary P&C Analyst, data analyst{" "}
              </div>
            </div>
          </Link>
        </div>

        {/* Niveau 4 - Autres membres */}
        <div className="org-level">
          <Link to="/communication one" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.communications")}</div>
              <div className="org-name">Erwan VOUNDI </div>
              <div className="org-titel">
                Étudiant chercheur et Analyste financier
              </div>
            </div>
          </Link>
          {/* <Link to="/communication two" className="link">
              <div className="org-name">Gervais Erwan</div>
              <div className="org-titel">Étudiant chercheur et Analyste financier</div>
            </Link> */}

          <Link to="/commissaire aux comptes" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.auditor")}</div>
              <div className="org-name">Jean Patrick Ulrich MANY AYISSI </div>
              <div className="org-titel">
                Maître en Ingénierie Economique et Financière
              </div>
            </div>
          </Link>
          <Link to="/charges des projets" className="link">
            <div className="org-node">
              <div className="org-title">{t("organization.projects")}</div>
              <div className="org-name">Léopold DJEUDJANG TEUNKWA </div>
              <div className="org-titel">
                Ingénieur Économiste et Financier, Expert en Analyse et
                Évaluation des Projets, Assistant au Département des
                Statistiques d'Entreprises à l'INS
              </div>
            </div>
          </Link>
        </div>

        {/* Niveau 5 - Conseillers et autres */}
        <div className="org-level">
          <div className="org-node">
            <div className="org-title">{t("organization.censors")}</div>
            <Link to="/censeur one" className="link">
              <div className="org-name">Dr.Salim Yazid Hamed</div>
              <div className="org-titel">
              Docteur en sciences économiques, option ingénierie
              économique et financière
              </div>
            </Link>
            <Link to="/censeur two" className="link">
              <div className="org-name">Gaëtan Aime BALLA MEKONGO</div>
              <div className="org-titel">
                Maître en Ingénierie Économique et financière
              </div>
            </Link>
          </div>

          <Link
            to="/responsable des affaires administratives et diplomatiques"
            className="link"
          >
            <div className="org-node">
              <div className="org-title">
                {t("organization.administrativeAffairs")}
              </div>
              <div className="org-name">Raphael ELOUNDOU NGONO</div>
              <div className="org-titel">Magistrat des Comptes</div>
            </div>
          </Link>
          <div className="org-node">
            <div className="org-title">{t("organization.advisors")}</div>
            <Link to="/conseiller one" className="link">
              <div className="org-name">Georges NGNOUWAL ELOUNDOU</div>
              <div className="org-titel">PhD en Économie Mathématique</div>
            </Link>
            <Link to="/conseiller two" className="link">
              <div className="org-name">Michèle Pierrette SIGNIN TCHOUPE </div>
              <div className="org-titel">
                PhD student en Sciences de Gestion
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
