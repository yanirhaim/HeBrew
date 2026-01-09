"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ConjugationIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4H16V16H4V4ZM2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V16C18 17.1046 17.1046 18 16 18H4C2.89543 18 2 17.1046 2 16V4Z"
      fill={isActive ? "#3B82F6" : "#94A3B8"}
    />
    <path
      d="M6 7H14M6 10H14M6 13H10"
      stroke={isActive ? "#3B82F6" : "#94A3B8"}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const TranslationIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 4H18M2 8H18M2 12H10M14 12H18M2 16H18"
      stroke={isActive ? "#3B82F6" : "#94A3B8"}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 4L14 8L12 12L10 8L12 4Z"
      fill={isActive ? "#3B82F6" : "#94A3B8"}
    />
  </svg>
);

const WordsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z"
      fill={isActive ? "#3B82F6" : "#94A3B8"}
    />
    <path
      d="M6 6H14M6 9H14M6 12H10"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const PracticeIcon = ({ isActive }: { isActive: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 2L12 8H18L13 11L15 17L10 14L5 17L7 11L2 8H8L10 2Z"
      fill={isActive ? "#3B82F6" : "#94A3B8"}
    />
  </svg>
);

const navItems = [
  { path: "/conjugation", label: "Conjugate", icon: ConjugationIcon },
  { path: "/translation", label: "Translate", icon: TranslationIcon },
  { path: "/words", label: "Words", icon: WordsIcon },
  { path: "/practice", label: "Practice", icon: PracticeIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-100 bg-white pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 transition-colors active:scale-95 ${
                isActive ? "bg-blue-50" : "hover:bg-blue-50/50"
              }`}
            >
              <IconComponent isActive={isActive} />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-blue-500" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
