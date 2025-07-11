import React from "react";
import "../styles/OrgChart.css";
import { Link } from "react-router-dom";

const OrgChart = () => {
  return (
    <div className="organigramme-container">
      <div className="org-header">
        <h1>ASSOCIATION DES ECONOMISTES</h1>
        <h1>ET GESTIONNAIRES DU CAMEROUN</h1>
      </div>

      <div className="org-tree">
        {/* Niveau 1 - Président */}
        <Link to="/president" className="link">
          <div className="org-level">
            <div className="org-node president">
              <div className="org-title">Président</div>
              <div className="org-name">Ngono Aristide Merlin, Ph</div>
              <div className="org-details">Université de Dschang</div>
            </div>
          </div>
        </Link>

        {/* Niveau 2 - Vice-Président et Secrétaire Général */}

        <div className="org-level">
          <Link to="/vice president" className="link">
            <div className="org-node vice-president">
              <div className="org-title">Vice-Président</div>
              <div className="org-name">Myogo Il Ossede</div>
              <div className="org-details">Franklin, Université Dschôl</div>
            </div>
          </Link>
          <Link to="/secretaire general" className="link">
            <div className="org-node secretary">
              <div className="org-title">Secrétaire Général</div>
              <div className="org-name">Ondoa Beyene</div>
              <div className="org-details">PhD Université de Dschang</div>
            </div>
          </Link>
        </div>

        {/* Niveau 3 - Autres postes */}

        <div className="org-level">
          <Link to="/tresorier" className="link">
            <div className="org-node">
              <div className="org-title">Trésorier</div>
              <div className="org-name">Zeh Inês Pétrolde</div>
              <div className="org-details">PhD Université a Bertoua</div>
            </div>
          </Link>
          <Link to="/responsable GRH" className="link">
            <div className="org-node">
              <div className="org-title">Responsable GRH</div>
              <div className="org-name">Kinfack Cyril Pierre</div>
            </div>
          </Link>
          <Link to="/relations exterieures" className="link">
            <div className="org-node">
              <div className="org-title">Relations extérieures</div>
              <div className="org-name">Tebou Tedon Marius Parfait</div>
            </div>
          </Link>
        </div>

        {/* Niveau 4 - Autres membres */}
        <div className="org-level">
            <div className="org-node communication">
              <div className="org-title">Chargés de la Communication</div>
              <Link to="/communication" className="link">
              <div className="org-name">Voundi Voundi</div>
              </Link>
              <Link to="/communication" className="link">
              <div className="org-name">Gervais Erwan</div>
              </Link>
            </div>
          <Link to="/commissaire aux comptes" className="link">
            <div className="org-node">
              <div className="org-title">Commissaire aux Comptes</div>
              <div className="org-name">Many Jean Patrick Ayissi</div>
            </div>
          </Link>
          <Link to="/charges des projets" className="link">
            <div className="org-node">
              <div className="org-title">Chargés des projets</div>
              <div className="org-name">Dieuignaj Teunhwa Leopold</div>
            </div>
          </Link>
        </div>

        {/* Niveau 5 - Conseillers et autres */}
        <div className="org-level">
          <Link to="/censeurs" className="link">
            <div className="org-node">
              <div className="org-title">Censeurs</div>
              <div className="org-name">Gaetan Mekong</div>
            </div>
          </Link>
          <Link to="/responsable des affaires administratives et diplomatiques" className="link">
            <div className="org-node">
              <div className="org-title">responsable des affaires administratives et diplomatiques</div>
              <div className="org-name">Eloundou</div>
            </div>
          </Link>
            <div className="org-node">
              <div className="org-title">Conseillers</div>
              <Link to="/conseillers" className="link">
              <div className="org-name">Eloundou Georges</div>
              </Link>
              <Link to="/conseillers" className="link">
              <div className="org-name">Signn Michelle</div>
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
