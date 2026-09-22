import { Fragment } from "react";
import {
  attachmentUrl,
  contentToText,
  formatFileSize,
} from "../../utils/announcements";
import "../../styles/AnnouncementBody.css";

// Une seule paire de parenthèses capturantes : après split, les URL sont aux indices impairs.
const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

// Rend les liens cliquables sans jamais interpréter de HTML : seuls http(s) et www
// sont reconnus, donc pas de lien javascript: possible.
function linkify(text) {
  return text.split(URL_PATTERN).map((part, index) => {
    if (index % 2 === 0) return part;
    const trailing = part.match(/[.,;:!?)\]]+$/)?.[0] || "";
    const url = trailing ? part.slice(0, -trailing.length) : part;
    const href = url.startsWith("http") ? url : `https://${url}`;
    return (
      <Fragment key={index}>
        <a href={href} target="_blank" rel="noopener noreferrer">{url}</a>
        {trailing}
      </Fragment>
    );
  });
}

export default function AnnouncementBody({ announcement }) {
  const text = contentToText(announcement.content) || announcement.summary || "";
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const attachments = announcement.attachments || [];
  const images = attachments.filter((a) => a.kind === "image");
  const documents = attachments.filter((a) => a.kind === "pdf");

  return (
    <div className="annb">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="annb-paragraph">{linkify(paragraph)}</p>
      ))}

      {images.length > 0 && (
        <div className={`annb-images ${images.length === 1 ? "annb-images--single" : ""}`}>
          {images.map((image) => (
            <a
              key={image._id}
              href={attachmentUrl(image)}
              target="_blank"
              rel="noopener noreferrer"
              className="annb-image-link"
              title="Ouvrir l'image en grand"
            >
              <img src={attachmentUrl(image)} alt={image.originalName} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="annb-docs">
          <p className="annb-docs-title">Documents joints</p>
          {documents.map((doc) => (
            <a
              key={doc._id}
              href={attachmentUrl(doc)}
              target="_blank"
              rel="noopener noreferrer"
              className="annb-doc"
            >
              <span className="annb-doc-icon" aria-hidden="true">PDF</span>
              <span className="annb-doc-name">{doc.originalName}</span>
              <span className="annb-doc-size">{formatFileSize(doc.size)}</span>
              <span className="annb-doc-open">Ouvrir →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
