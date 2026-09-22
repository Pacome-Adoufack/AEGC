const plural = (count, singular, pluralForm) => (count > 1 ? pluralForm : singular);

// Accueil de l'administration : ce qui attend une action, puis les raccourcis.
export default function AdminHome({ firstName, summary, isAdmin, goTo }) {
    const tasks = summary
        ? [
            summary.pendingMemberships > 0 && {
                key: 'memberships',
                icon: '💳',
                text: `${summary.pendingMemberships} ${plural(summary.pendingMemberships, 'cotisation à valider', 'cotisations à valider')}`,
                action: 'Valider',
                onClick: () => goTo('membres', 'cotisations', { vue: 'en-attente' }),
            },
            isAdmin && summary.submissionsToAssign > 0 && {
                key: 'submissions',
                icon: '📄',
                text: `${summary.submissionsToAssign} ${plural(summary.submissionsToAssign, 'soumission à assigner', 'soumissions à assigner')} à un gestionnaire`,
                action: 'Assigner',
                onClick: () => goTo('working-papers', undefined, { vue: 'a-assigner' }),
            },
            summary.recentMessages > 0 && {
                key: 'messages',
                icon: '✉️',
                text: `${summary.recentMessages} ${plural(summary.recentMessages, 'message reçu', 'messages reçus')} ces 7 derniers jours`,
                action: 'Lire',
                onClick: () => goTo('messages'),
            },
        ].filter(Boolean)
        : [];

    const stats = summary
        ? [
            { label: 'Membres actifs', value: summary.activeMembers, onClick: () => goTo('membres', 'cotisations') },
            { label: 'Abonnés newsletter', value: summary.subscribers, onClick: () => goTo('membres', 'abonnes') },
            isAdmin && { label: 'Appels à contributions ouverts', value: summary.openCalls, onClick: () => goTo('working-papers') },
        ].filter(Boolean)
        : [];

    return (
        <div className="adm-home">
            <div className="adm-home-hello">
                <h2>Bonjour {firstName || ''}</h2>
                <p>
                    {!summary
                        ? 'Chargement…'
                        : tasks.length === 0
                            ? 'Rien n\'attend votre action pour le moment.'
                            : `${tasks.length} ${plural(tasks.length, 'point demande', 'points demandent')} votre attention.`}
                </p>
            </div>

            {tasks.length > 0 && (
                <ul className="adm-tasks">
                    {tasks.map((task) => (
                        <li key={task.key}>
                            <span className="adm-task-icon" aria-hidden="true">{task.icon}</span>
                            <span className="adm-task-text">{task.text}</span>
                            <button type="button" className="adm-task-action" onClick={task.onClick}>
                                {task.action} →
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <h3 className="adm-home-heading">Publier sur le site</h3>
            <div className="adm-quick">
                <button type="button" className="adm-quick-card" onClick={() => goTo('publier', 'annonces', { nouveau: '1' })}>
                    <span className="adm-quick-icon" aria-hidden="true">📢</span>
                    <span>
                        <strong>Nouvelle annonce</strong>
                        <small>Texte, PDF et images, visibles sur l'accueil</small>
                    </span>
                </button>
                <button type="button" className="adm-quick-card" onClick={() => goTo('publier', 'photos', { nouveau: '1' })}>
                    <span className="adm-quick-icon" aria-hidden="true">🖼️</span>
                    <span>
                        <strong>Ajouter des photos</strong>
                        <small>Galerie « L'AEGC en images »</small>
                    </span>
                </button>
            </div>

            {stats.length > 0 && (
                <>
                    <h3 className="adm-home-heading">En chiffres</h3>
                    <div className="adm-stats">
                        {stats.map((stat) => (
                            <button type="button" key={stat.label} className="adm-stat" onClick={stat.onClick}>
                                <span className="adm-stat-label">{stat.label}</span>
                                {/* null = source indisponible : on affiche un tiret, jamais un faux 0 */}
                                <span className="adm-stat-value">{stat.value ?? '—'}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
