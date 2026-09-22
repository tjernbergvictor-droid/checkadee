import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={22}
      height={22}
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => base(<path d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5" />, p);
export const PlusIcon = (p: IconProps) => base(<path d="M12 5v14M5 12h14" />, p);
export const BookIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5v-13Z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13Z" />
    </>,
    p,
  );
export const SettingsIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.56V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.56 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>,
    p,
  );
export const MenuIcon = (p: IconProps) => base(<path d="M4 6h16M4 12h16M4 18h16" />, p);
export const CloseIcon = (p: IconProps) => base(<path d="M6 6l12 12M18 6 6 18" />, p);
export const SearchIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>,
    p,
  );
export const CheckIcon = (p: IconProps) => base(<path d="M5 12.5 10 17l9-10" />, p);
export const ChevronDownIcon = (p: IconProps) => base(<path d="m6 9 6 6 6-6" />, p);
export const ChevronRightIcon = (p: IconProps) => base(<path d="m9 6 6 6-6 6" />, p);
export const CalendarIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>,
    p,
  );
export const MapPinIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </>,
    p,
  );
export const TrashIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7" />
    </>,
    p,
  );
export const ArrowLeftIcon = (p: IconProps) => base(<path d="M19 12H5M11 6l-6 6 6 6" />, p);
export const GlobeIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.4-3.8-8.5S9.5 5.9 12 3.5Z" />
    </>,
    p,
  );
export const UploadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 15V4M12 4 7 9M12 4l5 5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>,
    p,
  );
export const DownloadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 4v11M12 15l-5-5M12 15l5-5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>,
    p,
  );
export const PencilIcon = (p: IconProps) =>
  base(
    <>
      <path d="m16.5 3.5 4 4L7 21l-4.5 1L4 17.5 16.5 3.5Z" />
      <path d="m14.5 5.5 4 4" />
    </>,
    p,
  );
export const XCircleIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </>,
    p,
  );
