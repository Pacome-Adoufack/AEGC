import { useEffect, useState } from "react";
import { API_BASE_URL } from "../Url";

// Inscriptions aux activités et aux formations.
export default function ReservationsPanel({ token }) {
    const [reservations, setReservations] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/reservation/all`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`code ${r.status}`))))
            .then(setReservations)
            .catch(() => setFailed(true));
    }, [token]);

    if (failed) return <p className="adm-empty">Impossible de charger les réservations.</p>;
    if (!reservations) return <p className="adm-empty">Chargement…</p>;

    const activities = reservations.activities || [];
    const formations = reservations.formations || [];

    return (
        <div className="reservations-section">
            <h2>Réservations</h2>

            <h3>Activités ({activities.length})</h3>
            {activities.length === 0 ? (
                <p className="adm-empty">Aucune réservation d'activité.</p>
            ) : (
                <div className="reservations-table">
                    <table>
                        <thead><tr><th>Participant</th><th>Email</th><th>Activité</th><th>Date</th></tr></thead>
                        <tbody>
                            {activities.map((r) => (
                                <tr key={r._id}>
                                    <td>{r.user?.firstName} {r.user?.name}</td>
                                    <td>{r.user?.email}</td>
                                    <td>{r.activity?.name}</td>
                                    <td>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h3 style={{ marginTop: "2rem" }}>Formations ({formations.length})</h3>
            {formations.length === 0 ? (
                <p className="adm-empty">Aucune inscription à une formation.</p>
            ) : (
                <div className="reservations-table">
                    <table>
                        <thead><tr><th>Participant</th><th>Email</th><th>Formation</th><th>Date</th></tr></thead>
                        <tbody>
                            {formations.map((r) => (
                                <tr key={r._id}>
                                    <td>{r.firstName} {r.lastName}</td>
                                    <td>{r.email}</td>
                                    <td>{r.formationId?.title}</td>
                                    <td>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
