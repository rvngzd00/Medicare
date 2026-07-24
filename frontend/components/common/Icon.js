const paths = {
  arrow: <path d="m8 5 7 7-7 7m7-7H3" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  calendar: <path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h3v3H8v-3Z" />,
  phone: <path d="M7.2 3.8 10 8 8.3 9.7c1.1 2.3 3 4.2 5.3 5.3l1.7-1.7 4.2 2.8-.8 3.2c-.2.7-.8 1.2-1.6 1.2C9.6 20.5 3.5 14.4 3.5 6.9c0-.8.5-1.4 1.2-1.6l2.5-1.5Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  location: <><path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  shield: <path d="M12 3 5 6v5c0 4.5 2.9 8.2 7 10 4.1-1.8 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4" />,
  heart: <path d="M20.5 9c0 5-8.5 10-8.5 10S3.5 14 3.5 9A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2Z" />,
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  brain: <path d="M9 5a3 3 0 0 0-5 2.2A3 3 0 0 0 4.5 13 3.5 3.5 0 0 0 9 18.5V5Zm6 0a3 3 0 0 1 5 2.2 3 3 0 0 1-.5 5.8 3.5 3.5 0 0 1-4.5 5.5V5ZM9 9H7m2 5H6m9-5h2m-2 5h3" />,
  family: <><circle cx="12" cy="7" r="3" /><circle cx="5.5" cy="10" r="2" /><circle cx="18.5" cy="10" r="2" /><path d="M7 20v-3a5 5 0 0 1 10 0v3M2.5 19v-2a3 3 0 0 1 4-2.8m15 4.8v-2a3 3 0 0 0-4-2.8" /></>,
  cross: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" />,
  flower: <path d="M12 11c-3-1-4.5-3.3-3-5.4 1.1-1.6 3-.7 3 .8 0-1.5 1.9-2.4 3-.8 1.5 2.1 0 4.4-3 5.4Zm0 0c-3 1-4.5 3.3-3 5.4 1.1 1.6 3 .7 3-.8 0 1.5 1.9 2.4 3 .8 1.5-2.1 0-4.4-3-5.4Zm0 0c-1-3-3.3-4.5-5.4-3-1.6 1.1-.7 3 .8 3-1.5 0-2.4 1.9-.8 3 2.1 1.5 4.4 0 5.4-3Zm0 0c1-3 3.3-4.5 5.4-3 1.6 1.1.7 3-.8 3 1.5 0 2.4 1.9.8 3-2.1 1.5-4.4 0-5.4-3Z" />,
  skin: <path d="M7 20c0-5 4-6 4-10 0-2-1-3-1-5m7 15c0-5-4-6-4-10 0-2 1-3 1-5M5 9h14M6 14h12" />,
  tooth: <path d="M7 4c2-1 3 .5 5 .5S15 3 17 4c3 1.5 2 5 .7 8-.8 2-1.2 8-3.2 8-1.8 0-.8-5-2.5-5s-.7 5-2.5 5c-2 0-2.4-6-3.2-8C5 9 4 5.5 7 4Z" />,
  eye: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  scan: <><path d="M8 3H4v4m12-4h4v4M8 21H4v-4m12 4h4v-4" /><circle cx="12" cy="12" r="4" /></>,
  flask: <path d="M9 3h6m-5 0v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3m-6 12h8" />,
  waves: <path d="M3 9c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />,
  motion: <path d="M4 15c3-6 6-6 9 0 2 4 4 4 7 0M5 8h7m-7 4h4" />,
  chat: <path d="M4 5h16v11H9l-5 4V5Zm4 5h8m-8 3h5" />,
  spark: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Zm7 12 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  star: <path d="m12 3 2.6 5.5 6 .8-4.4 4.3 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.3 6-.8L12 3Z" />,
  share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5m-8 7 8 5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.7 6.4h.01" /></>,
  whatsapp: <><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" /><path d="M9 8.2c.4 2.6 2.2 4.4 4.8 4.8l1.2-1.2 2 1.2-.5 2c-.1.5-.6.8-1.1.8-4 0-7.2-3.2-7.2-7.2 0-.5.3-1 .8-1.1l2-.5 1.2 2L11 10.2" /></>,
  alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  document: <path d="M6 3h8l4 4v14H6V3Zm8 0v5h5M9 12h6m-6 4h6" />
};

export default function Icon({ name, size = 24, className = "", strokeWidth = 1.7 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || paths.cross}
    </svg>
  );
}
