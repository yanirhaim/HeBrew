"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACTIVE_COLOR = "#1cb0f6";
const INACTIVE_COLOR = "#afafaf";

const ConjugationIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill={isActive ? `${ACTIVE_COLOR}20` : "none"}
    />
    <path
      d="M8 8h8M8 12h8M8 16h4"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const TranslationIcon = ({ isActive }: { isActive: boolean }) => {
  const strokeColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="0.5"
        y1="3.35"
        x2="12"
        y2="3.35"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
      />
      <line
        x1="6.25"
        y1="0.48"
        x2="6.25"
        y2="3.35"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
      />
      <path
        d="M9.12,3.35c0,3.52-3.28,8.2-7.66,10.55"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
        fill="none"
      />
      <path
        d="M4.51,7.37A16.4,16.4,0,0,0,11,13.9"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
        fill="none"
      />
      <polyline
        points="12.96 22.52 16.79 11.98 17.75 11.98 21.58 22.52"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="20.43"
        y1="18.69"
        x2="15.07"
        y2="18.69"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
      />
      <line
        x1="11.04"
        y1="22.52"
        x2="14.88"
        y2="22.52"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
      />
      <line
        x1="19.67"
        y1="22.52"
        x2="23.5"
        y2="22.52"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeMiterlimit="10"
      />
    </svg>
  );
};

const WordsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill={isActive ? `${ACTIVE_COLOR}20` : "none"}
    />
    <circle
      cx="12"
      cy="10"
      r="3"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
    />
    <path
      d="M8 16h8"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const PracticeIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 17.0002V11.4522C20 10.9179 19.9995 10.6506 19.9346 10.4019C19.877 10.1816 19.7825 9.97307 19.6546 9.78464C19.5102 9.57201 19.3096 9.39569 18.9074 9.04383L14.1074 4.84383C13.3608 4.19054 12.9875 3.86406 12.5674 3.73982C12.1972 3.63035 11.8026 3.63035 11.4324 3.73982C11.0126 3.86397 10.6398 4.19014 9.89436 4.84244L5.09277 9.04383C4.69064 9.39569 4.49004 9.57201 4.3457 9.78464C4.21779 9.97307 4.12255 10.1816 4.06497 10.4019C4 10.6506 4 10.9179 4 11.4522V17.0002C4 17.932 4 18.3978 4.15224 18.7654C4.35523 19.2554 4.74432 19.6452 5.23438 19.8482C5.60192 20.0005 6.06786 20.0005 6.99974 20.0005C7.93163 20.0005 8.39808 20.0005 8.76562 19.8482C9.25568 19.6452 9.64467 19.2555 9.84766 18.7654C9.9999 18.3979 10 17.932 10 17.0001V16.0001C10 14.8955 10.8954 14.0001 12 14.0001C13.1046 14.0001 14 14.8955 14 16.0001V17.0001C14 17.932 14 18.3979 14.1522 18.7654C14.3552 19.2555 14.7443 19.6452 15.2344 19.8482C15.6019 20.0005 16.0679 20.0005 16.9997 20.0005C17.9316 20.0005 18.3981 20.0005 18.7656 19.8482C19.2557 19.6452 19.6447 19.2554 19.8477 18.7654C19.9999 18.3978 20 17.932 20 17.0002Z"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ReadingIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isActive ? `${ACTIVE_COLOR}20` : "none"}
    />
    <path
      d="M8 7h8M8 11h8M8 15h4"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const NewsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      fill={isActive ? `${ACTIVE_COLOR}20` : "none"}
    />
    <path
      d="M7 8h6M7 12h10M7 16h8"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const FlashcardsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={isActive ? `${ACTIVE_COLOR}20` : "none"}
    />
  </svg>
);

const navItems = [
  { path: "/practice", icon: PracticeIcon },
  { path: "/translation", icon: TranslationIcon },
  { path: "/news", icon: NewsIcon },
  { path: "/verbs", icon: WordsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-feather-gray bg-white pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl transition-all active:scale-95`}
            >
              <IconComponent isActive={isActive} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
