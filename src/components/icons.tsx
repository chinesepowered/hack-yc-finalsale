import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

export const TagIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12.2V4.5A1.5 1.5 0 0 1 4.5 3h7.7a1.5 1.5 0 0 1 1.06.44l7.3 7.3a1.5 1.5 0 0 1 0 2.12l-7.7 7.7a1.5 1.5 0 0 1-2.12 0l-7.3-7.3A1.5 1.5 0 0 1 3 12.2Z" />
    <circle cx="8" cy="8" r="1.6" />
  </svg>
);
export const FlagIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
    <path d="M12 10v4.2M12 17.2v.1" />
  </svg>
);
export const NoteIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8v.1" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.3 12.3 2.4 2.4 5-5.2" />
  </svg>
);
export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
  </svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </svg>
);
export const SparkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" />
    <path d="M18.5 15.5c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5Z" />
  </svg>
);
export const HangerIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 7.5a2 2 0 1 1 2-2" />
    <path d="M12 7.5v1.8L3.4 15.2a1.2 1.2 0 0 0 .7 2.2h15.8a1.2 1.2 0 0 0 .7-2.2L12 9.3" />
  </svg>
);
export const RulerIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
    <path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" />
  </svg>
);
export const CodeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.2 5.5l-2.4 13" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const BookmarkIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5V20l-7-4.2L5 20V5.5A1.5 1.5 0 0 1 6.5 4Z" />
  </svg>
);
export const CompareIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="7.5" height="16" rx="1.5" />
    <rect x="13.5" y="4" width="7.5" height="16" rx="1.5" />
  </svg>
);
export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2A1.5 1.5 0 0 0 8.8 20.6h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </svg>
);
export const LockIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const ReplayIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4 4.5v3.8h3.8" />
    <path d="m10.5 9.3 4 2.7-4 2.7Z" />
  </svg>
);
export const BoltIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6L13 3Z" />
  </svg>
);

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M4 17V6.5A2.5 2.5 0 0 1 6.5 4H17l11 11-13 13L4 17Z" fill="#24365c" />
      <circle cx="10.5" cy="10.5" r="2.4" fill="#f6f1e8" />
      <path d="M13.5 21.5 21 14" stroke="#f6f1e8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 24l7.5-7.5" stroke="#b3261e" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
