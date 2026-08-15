type SocialLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

// Fill in real hrefs — left as "#" placeholders.
const links: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/aabhash_malviya/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/playlist?list=PLfBKhLJ57-HU&si=sp0zg-j8ZZdI_Ugw",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 9.2 15 12l-4.5 2.8V9.2Z" fill="currentColor" />
      </svg>
    ),
  },
  // {
  //   label: "X",
  //   href: "#",
  //   icon: (
  //     <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
  //       <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  //     </svg>
  //   ),
  // },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.label}
          className="text-white/70 hover:text-white transition-colors"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
