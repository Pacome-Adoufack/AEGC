export const EMPTY_FORM = {
    fullName: "",
    academicTitle: "",
    roleTitle: "",
    affiliation: "",
    email: "",
    profileLink: "",
    displayOrder: 0,
    isActive: true,
};

export const ACADEMIC_TITLES = [
    { value: "", label: "Aucun" },
    { value: "Pr.", label: "Professeur (Pr.)" },
    { value: "Dr.", label: "Docteur (Dr.)" },
    { value: "M.", label: "Monsieur (M.)" },
    { value: "Mme", label: "Madame (Mme)" },
];

export const SORT_OPTIONS = [
    { value: "displayOrder_asc", label: "Ordre (croissant)" },
    { value: "displayOrder_desc", label: "Ordre (décroissant)" },
    { value: "fullName_asc", label: "Nom (A-Z)" },
    { value: "fullName_desc", label: "Nom (Z-A)" },
    { value: "roleTitle_asc", label: "Catégorie (A-Z)" },
    { value: "affiliation_asc", label: "Institution (A-Z)" },
];

export const detectAcademicTitle = (fullName = "") => {
    const trimmed = String(fullName).trim();
    if (!trimmed) return "";
    const n = trimmed.toLowerCase();
    if (n.startsWith("pr ") || n.startsWith("pr.")) return "Pr.";
    if (n.startsWith("prof ") || n.startsWith("prof.")) return "Pr.";
    if (n.startsWith("dr ") || n.startsWith("dr.")) return "Dr.";
    if (n.startsWith("docteur ")) return "Dr.";
    if (n.startsWith("mme ") || n.startsWith("mme.")) return "Mme";
    if (n.startsWith("mr ") || n.startsWith("mr.")) return "M.";
    if (n.startsWith("m ") || n.startsWith("m.")) return "M.";
    return "";
};

export const stripAcademicTitle = (fullName = "") =>
    String(fullName)
        .trim()
        .replace(/^(pr\.?|prof\.?|professeur|dr\.?|docteur|mme\.?|mr\.?|m\.?)[\s-]+/i, "")
        .trim();

export const composeFullName = (title, name) => {
    const cleanedName = stripAcademicTitle(name);
    if (!cleanedName) return "";
    return title ? `${title} ${cleanedName}`.trim() : cleanedName;
};
