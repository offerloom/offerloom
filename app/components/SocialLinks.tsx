import { SOCIAL_LINKS } from "../lib/site";

function SocialIcon({ id }: { id: (typeof SOCIAL_LINKS)[number]["id"] }) {
  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5zM17.8 7.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" fill="currentColor" />
      </svg>
    );
  }

  if (id === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.09 5 12 5 12 5s-6.09 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.91 19 12 19 12 19s6.09 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.4-4.8zM10 15.5v-7l6 3.5z" fill="currentColor" />
      </svg>
    );
  }

  if (id === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 8.5V7.2c0-.66.54-1.2 1.2-1.2h1.8V3h-2.46C11.57 3 10 4.57 10 6.54V8.5H7.5V12H10v9h3.5v-9h2.95l.55-3.5H13.5z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.9 3H21l-6.6 7.55L22 21h-6.2l-4.85-6.34L5.5 21H3.4l7.05-8.07L2 3h6.36l4.38 5.79L18.9 3zm-1.1 16.2h1.7L7.2 4.7H5.4l12.4 14.5z" fill="currentColor" />
    </svg>
  );
}

type SocialLinksProps = {
  variant?: "header" | "footer";
};

export default function SocialLinks({ variant = "footer" }: SocialLinksProps) {
  return (
    <div className={`socialLinks socialLinks-${variant}`}>
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          title={link.label}
        >
          <SocialIcon id={link.id} />
        </a>
      ))}
    </div>
  );
}
