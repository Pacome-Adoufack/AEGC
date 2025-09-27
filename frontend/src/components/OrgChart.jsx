import React from "react";
import "../styles/OrgChart.css";
import { Link } from "react-router-dom";

const OrgChart = () => {
  return (
    <div className="organigramme-container">
      <div className="org-header">
        <h1>MEMBRES DU BUREAU EXÉCUTIF DE L'AEGC</h1>
      </div>

      <div className="org-tree">
        {/* Niveau 1 - Président */}
        <Link to="/president" className="link">
          <div className="org-level">
            <div className="org-node">
              <div className="org-title">Président</div>
              <div className="org-name">Aristide Merlin Ngono </div>
              <div className="org-titel">PhD en Economie de la santé </div>
            </div>
          </div>
        </Link>

        {/* Niveau 2 - Vice-Président et Secrétaire Général */}

        <div className="org-level">
          <Link to="/vice president" className="link">
            <div className="org-node">
              <div className="org-title">Vice-Président</div>
              <div className="org-name">Daave MVOGO II OSSEDE</div>
              <div className="org-titel">Doctorant en analyse politique </div>
            </div>
          </Link>
          <Link to="/secretaire general" className="link">
            <div className="org-node">
              <div className="org-title">Secrétaire Général</div>
              <div className="org-name">Blaise BEYENE ONDOUA  </div>
              <div className="org-titel">PhD en Economie mathématique </div>
            </div>
          </Link>
        </div>

        {/* Niveau 3 - Autres postes */}

        <div className="org-level">
          <Link to="/tresorier" className="link">
            <div className="org-node">
              <div className="org-title">Trésorier</div>
              <div className="org-name">Inès Pérolde ZEH</div>
              <div className="org-titel">PhD en économie du travail</div>
            </div>
          </Link>
          <Link to="/responsable GRH" className="link">
            <div className="org-node">
              <div className="org-title">Responsable GRH</div>
              <div className="org-name">Cyril Pierre Kenfack </div>
              <div className="org-titel">Doctorant en management </div>
            </div>
          </Link>
          <Link to="/relations exterieures" className="link">
            <div className="org-node">
              <div className="org-title">Relations extérieures</div>
              <div className="org-name">Marius Parfait Tebou Tedong </div>
              <div className="org-titel">Actuaire P&C, Analyste de Données, Axa Partners IPA</div>
            </div>
          </Link>
        </div>

        {/* Niveau 4 - Autres membres */}
        <div className="org-level">
          <div className="org-node">
            <div className="org-title">Chargés de la Communication</div>
            <Link to="/communication one" className="link">
              <div className="org-name">Gervais VOUNDI VOUNDI </div>
              <div className="org-titel">Conseillé consultatif national</div>
            </Link>
            {/* <Link to="/communication two" className="link">
              <div className="org-name">Gervais Erwan</div>
            </Link> */}
          </div>
          <Link to="/commissaire aux comptes" className="link">
            <div className="org-node">
              <div className="org-title">Commissaire aux Comptes</div>
              <div className="org-name">Jean Parick MANY AYISSI </div>
              <div className="org-titel">MSc en banque et finance UCAC</div>
            </div>
          </Link>
          <Link to="/charges des projets" className="link">
            <div className="org-node">
              <div className="org-title">Chargés des projets</div>
              <div className="org-name">Léopold DJEUDJANG TEUNKWA</div>
              <div className="org-titel">Ingénieur Economiste et Financier</div>
            </div>
          </Link>
        </div>

        {/* Niveau 5 - Conseillers et autres */}
        <div className="org-level">
          <Link to="/censeurs" className="link">
            <div className="org-node">
              <div className="org-title">Censeurs</div>
              <div className="org-name">Gaetan Aimé BALLA MEKONGO</div>
              <div className="org-titel">Economiste</div>
            </div>
          </Link>
          <Link
            to="/responsable des affaires administratives et diplomatiques"
            className="link"
          >
            <div className="org-node">
              <div className="org-title">
                Responsable des affaires administratives et diplomatiques
              </div>
              <div className="org-name">Raphaél Eloundou</div>
              <div className="org-titel">Magistrat des Comptes</div>
            </div>
          </Link>
          <div className="org-node">
            <div className="org-title">Conseillers</div>
            <Link to="/conseiller one" className="link">
              <div className="org-name">Eloundou Georges</div>
              <div className="org-titel">...</div>
            </Link>
            <Link to="/conseiller two" className="link">
              <div className="org-name">Michèle Pierrette SIGNIN TCHOUPE </div>
              <div className="org-titel">Doctorante en Sciences de Gestion</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
