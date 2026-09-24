import { SOCIAL_LINKS } from "../lib/site";

function SocialIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 8.5V7.2c0-.66.54-1.2 1.2-1.2h1.8V3h-2.46C11.57 3 10 4.57 10 6.54V8.5H7.5V12H10v9h3.5v-9h2.95l.55-3.5H13.5z" fill="currentColor" />
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
          <SocialIcon />
        </a>
      ))}
    </div>
  );
}
