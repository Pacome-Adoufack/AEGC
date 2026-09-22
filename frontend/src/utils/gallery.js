import { API_BASE_URL } from "../components/Url";

export const galleryImageUrl = (photo, size = "thumb") =>
  `${API_BASE_URL}${size === "full" ? photo.fullUrl : photo.thumbUrl}`;

// Année de rattachement : date de l'événement si connue, sinon date d'ajout.
export const photoYear = (photo) => new Date(photo.eventDate || photo.createdAt).getFullYear();

export const formatPhotoDate = (photo) => {
  if (!photo.eventDate) return "";
  // eventDate est une date seule ("2026-09-15") : on la lit en UTC pour ne pas
  // afficher la veille selon le fuseau du visiteur.
  return new Date(`${photo.eventDate}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Réduit une photo dans le navigateur avant l'envoi. Une photo de téléphone
// (4000 px, 5 Mo) devient un JPEG de quelques centaines de Ko. Le passage par le
// canvas supprime aussi les métadonnées EXIF, dont la position GPS.
export async function resizeImage(file, maxDimension, quality) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  // Fond blanc : un PNG transparent ne doit pas devenir noir une fois en JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Conversion de l'image impossible"))),
      "image/jpeg",
      quality,
    ),
  );
  return { blob, width, height };
}

export const prepareGalleryPhoto = async (file) => {
  const [full, thumb] = await Promise.all([
    resizeImage(file, 2000, 0.85),
    resizeImage(file, 640, 0.8),
  ]);
  return { full, thumb };
};
