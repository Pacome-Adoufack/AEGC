import { useCallback, useState } from "react";
import { API_BASE_URL } from "../Url";
import { normalizeStatus } from "./wpConstants";

const RECENT_DAYS = 7;

// Charge une source ; en cas d'échec, renvoie null au lieu de tout faire tomber.
const fetchJson = async (path, token) => {
    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

// Chiffres de l'accueil admin et des pastilles de navigation. Une valeur à null
// signifie « inconnue » (source indisponible) et ne doit pas s'afficher comme 0.
export default function useAdminSummary(token, { includeWorkingPapers }) {
    const [summary, setSummary] = useState(null);

    const refresh = useCallback(async () => {
        const [memberships, submissions, contacts, subscribers, calls] = await Promise.all([
            fetchJson("/memberships/stats", token),
            includeWorkingPapers ? fetchJson("/api/admin/submissions", token) : Promise.resolve(null),
            fetchJson("/contact", token),
            fetchJson("/subscribe", token),
            includeWorkingPapers ? fetchJson("/api/working-papers") : Promise.resolve(null),
        ]);

        const since = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

        setSummary({
            pendingMemberships: memberships?.success ? memberships.stats.pending : null,
            activeMembers: memberships?.success ? memberships.stats.active : null,
            submissionsToAssign: Array.isArray(submissions)
                ? submissions.filter((s) => normalizeStatus(s.status) === "soumise" && !s.assignedDispatcher).length
                : null,
            recentMessages: Array.isArray(contacts)
                ? contacts.filter((c) => new Date(c.createdAt).getTime() >= since).length
                : null,
            subscribers: Array.isArray(subscribers) ? subscribers.length : null,
            openCalls: Array.isArray(calls) ? calls.filter((wp) => wp.status === "ouvert").length : null,
        });
    }, [token, includeWorkingPapers]);

    // Pas de chargement automatique ici : le dashboard appelle refresh() à chaque
    // changement de rubrique, premier affichage compris.
    return { summary, refresh };
}
