import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../common/ConfirmDialog";
import AdminHome from "../admin/AdminHome";
import useAdminSummary from "../admin/useAdminSummary";
import MembershipsTab from "../admin/MembershipsTab";
import AnnouncementsTab from "../admin/AnnouncementsTab";
import GalleryTab from "../admin/GalleryTab";
import AwardsTab from "../admin/AwardsTab";
import ContactsPanel from "../admin/ContactsPanel";
import SubscribersPanel from "../admin/SubscribersPanel";
import ReservationsPanel from "../admin/ReservationsPanel";
import AdminWorkingPapers from "./AdminWorkingPapers";
import "../../styles/AdminDashboard.css";

// Rubriques de l'administration, rangées selon ce que l'admin vient faire.
// "sub" : sous-parties d'une rubrique, la première est celle par défaut.
const SECTIONS = [
    { id: "accueil", label: "Accueil", icon: "🏠" },
    {
        id: "publier", label: "Publier", icon: "📢",
        sub: [
            { id: "annonces", label: "Annonces" },
            { id: "photos", label: "Photos" },
            { id: "prix", label: "Prix" },
        ],
    },
    { id: "working-papers", label: "Working papers", icon: "📄", adminOnly: true, badge: "submissionsToAssign" },
    {
        id: "membres", label: "Membres", icon: "👥", badge: "pendingMemberships",
        sub: [
            { id: "cotisations", label: "Cotisations" },
            { id: "reservations", label: "Réservations" },
            { id: "abonnes", label: "Abonnés" },
        ],
    },
    { id: "messages", label: "Messages", icon: "✉️", badge: "recentMessages" },
];

// Anciens liens ?tab=… (avant la réorganisation) : on les redirige.
const LEGACY_TABS = {
    overview: ["accueil"],
    content: ["publier"],
    announcements: ["publier", "annonces"],
    gallery: ["publier", "photos"],
    memberships: ["membres", "cotisations"],
    reservations: ["membres", "reservations"],
    subscribers: ["membres", "abonnes"],
    contacts: ["messages"],
};

export default function AdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [message, setMessage] = useState("");
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", onConfirm: null, type: "danger" });
    const navigate = useNavigate();

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = currentUser.role === "admin";

    useEffect(() => {
        if (!["admin", "dev"].includes(currentUser.role)) navigate("/home");
    }, [currentUser.role, navigate]);

    const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
    const { summary, refresh } = useAdminSummary(token, { includeWorkingPapers: isAdmin });

    // Rubrique et sous-partie courantes, lues dans l'URL (partageables, et le
    // bouton Précédent du navigateur fonctionne).
    const legacy = LEGACY_TABS[searchParams.get("tab")];
    const sectionId = legacy?.[0] || searchParams.get("section") || "accueil";
    const section = sections.find((s) => s.id === sectionId) || sections[0];
    const subId = (legacy?.[1] || searchParams.get("sub")) ?? section.sub?.[0].id;
    const sub = section.sub?.find((s) => s.id === subId) || section.sub?.[0];
    const startCreating = searchParams.get("nouveau") === "1";

    const goTo = useCallback((nextSection, nextSub, extra = {}) => {
        const params = { section: nextSection, ...(nextSub ? { sub: nextSub } : {}), ...extra };
        setSearchParams(params);
        window.scrollTo({ top: 0 });
    }, [setSearchParams]);

    // Le paramètre "nouveau" ne sert qu'une fois : on le retire après usage.
    const clearStartCreating = useCallback(() => {
        const params = Object.fromEntries(searchParams.entries());
        delete params.nouveau;
        setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    // Pastilles et accueil à jour quand on change de rubrique (ex. après avoir
    // validé des cotisations).
    useEffect(() => { refresh(); }, [section.id, refresh]);

    // Toute action qui modifie des données affiche un message (cotisation validée,
    // message supprimé…) : on en profite pour remettre les pastilles à jour.
    useEffect(() => { if (message) refresh(); }, [message, refresh]);

    // L'onglet Cotisations recharge ses données en « changeant d'onglet » après une
    // activation manuelle : on le traduit par un remontage du composant.
    const [membershipsKey, setMembershipsKey] = useState(0);
    const reloadMemberships = useCallback(() => {
        setMembershipsKey((k) => k + 1);
        refresh();
    }, [refresh]);

    const flash = useCallback((text) => {
        setMessage(text);
        setTimeout(() => setMessage(""), 3000);
    }, []);

    const openConfirm = ({ title, message: text, onConfirm, type = "danger" }) =>
        setConfirmState({ isOpen: true, title, message: text, onConfirm, type });

    const badgeFor = (s) => {
        const value = s.badge && summary ? summary[s.badge] : 0;
        return value > 0 ? value : null;
    };

    return (
        <div className="admin-dashboard adm-shell">
            <div className="adm-layout">
                <nav className="adm-nav" aria-label="Rubriques de l'administration">
                    <p className="adm-nav-title">Administration</p>
                    {sections.map((s) => {
                        const badge = badgeFor(s);
                        return (
                            <button
                                key={s.id}
                                type="button"
                                className={`adm-nav-item ${s.id === section.id ? "active" : ""}`}
                                aria-current={s.id === section.id ? "page" : undefined}
                                onClick={() => goTo(s.id)}
                            >
                                <span className="adm-nav-icon" aria-hidden="true">{s.icon}</span>
                                <span className="adm-nav-label">{s.label}</span>
                                {badge && <span className="adm-badge" aria-label={`${badge} en attente`}>{badge}</span>}
                            </button>
                        );
                    })}
                </nav>

                <main className="adm-main">
                    {message && <div className="admin-message" role="status">{message}</div>}

                    {section.sub && (
                        <div className="adm-subnav" role="tablist" aria-label={section.label}>
                            {section.sub.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={s.id === sub.id}
                                    className={s.id === sub.id ? "active" : ""}
                                    onClick={() => goTo(section.id, s.id)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={section.id === "working-papers" ? "adm-panel adm-panel--bare" : "adm-panel"}>
                        {section.id === "accueil" && (
                            <AdminHome firstName={currentUser.firstName} summary={summary} isAdmin={isAdmin} goTo={goTo} />
                        )}

                        {section.id === "publier" && sub.id === "annonces" && (
                            <AnnouncementsTab
                                token={token}
                                setMessage={setMessage}
                                openConfirm={openConfirm}
                                startCreating={startCreating}
                                onStartHandled={clearStartCreating}
                            />
                        )}
                        {section.id === "publier" && sub.id === "photos" && (
                            <GalleryTab
                                token={token}
                                setMessage={setMessage}
                                openConfirm={openConfirm}
                                startCreating={startCreating}
                                onStartHandled={clearStartCreating}
                            />
                        )}

                        {section.id === "publier" && sub.id === "prix" && (
                            <AwardsTab
                                token={token}
                                setMessage={setMessage}
                                openConfirm={openConfirm}
                            />
                        )}

                        {section.id === "working-papers" && (
                            <AdminWorkingPapers
                                embedded
                                initialTab={searchParams.get("vue") === "a-assigner" ? "submissions" : undefined}
                            />
                        )}

                        {section.id === "membres" && sub.id === "cotisations" && (
                            <MembershipsTab
                                key={membershipsKey}
                                token={token}
                                setMessage={setMessage}
                                setActiveTab={reloadMemberships}
                                initialTab={searchParams.get("vue") === "en-attente" ? "pending" : undefined}
                            />
                        )}
                        {section.id === "membres" && sub.id === "reservations" && <ReservationsPanel token={token} />}
                        {section.id === "membres" && sub.id === "abonnes" && (
                            <SubscribersPanel token={token} flash={flash} openConfirm={openConfirm} onChange={refresh} />
                        )}

                        {section.id === "messages" && (
                            <ContactsPanel token={token} flash={flash} openConfirm={openConfirm} onChange={refresh} />
                        )}
                    </div>
                </main>
            </div>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={() => { if (typeof confirmState.onConfirm === "function") confirmState.onConfirm(); }}
                onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
            />
        </div>
    );
}
