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
      d="M12 2l2.5 7h7l-5.5 4 2 7-6-4.5L6 20l2-7-5.5-4h7L12 2z"
      stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill={isActive ? `${ACTIVE_COLOR}20` : "none"}
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
  { path: "/flashcards", icon: FlashcardsIcon },
  { path: "/translation", icon: TranslationIcon },
  { path: "/reading", icon: ReadingIcon },
  { path: "/verbs", icon: WordsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const hideOnPaths = ["/practice/daily"];
  const shouldHide = hideOnPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (shouldHide) return null;

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
