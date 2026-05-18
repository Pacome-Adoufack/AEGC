export const LEGACY_STATUS_TO_NEW = {
    "reçue": "soumise",
    "reÃ§ue": "soumise",
    en_attente: "en_revision",
    "traitée": "revision_requise",
    "traitÃ©e": "revision_requise",
    "terminée": "acceptee",
    "terminÃ©e": "acceptee",
};

export const SUBMISSION_STATUS_LABELS = {
    soumise: "Soumise",
    en_revision: "En revision",
    revision_requise: "A modifier",
    rejetee: "Rejetee",
    acceptee: "Acceptee",
};

export const SUBMISSION_STATUS_ORDER = [
    "soumise",
    "en_revision",
    "revision_requise",
    "rejetee",
    "acceptee",
];

export const JEL_OPTIONS = [
    { code: "E52", label: "Politique monetaire" },
    { code: "F31", label: "Taux de change" },
    { code: "O11", label: "Developpement economique" },
    { code: "C23", label: "Donnees de panel" },
    { code: "G12", label: "Prix des actifs" },
    { code: "H30", label: "Fiscalite et depenses publiques" },
    { code: "I32", label: "Mesure de la pauvrete" },
    { code: "J24", label: "Capital humain" },
];

export const JEL_CODE_REGEX = /^[A-Z][0-9]{2}$/;

export const normalizeStatus = (status) => LEGACY_STATUS_TO_NEW[status] || status;
export const normalizeJelCode = (code) => String(code || "").trim().toUpperCase();

export const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric", month: "long", day: "numeric",
    });
};

export const buildUsefulLinksFromText = (text) =>
    String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
