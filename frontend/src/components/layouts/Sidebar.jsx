"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbBug,
  TbBrandTelegram,
  TbMessageChatbot,
  TbLogout,
  TbUser,
  TbSettings,
} from "react-icons/tb";
import { useSession, signOut } from "next-auth/react";
import ReportBugModal from "../ReportBugModal";
import Dropdown from "../Dropdown";

const MENU_ITEMS = [
  {
    href: "/support",
    icon: TbMessageChatbot,
    label: "Contact Support",
    iconColor: "text-secondary",
  },
  {
    href: "#",
    icon: TbBug,
    label: "Report a Bug",
    iconColor: "text-secondary",
    action: "reportBug",
  },
  {
    href: "https://t.me/your_telegram_group",
    icon: TbBrandTelegram,
    label: "Join Telegram",
    iconColor: "text-secondary",
    external: true,
  },
];

const DROPDOWN_ITEMS = [
  {
    label: "Logout",
    icon: TbLogout,
    action: "logout",
    danger: true,
  },
];

export default function Sidebar({ isStaticLayout }) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const userName = session?.user?.name || "Guest";
  const userImage = session?.user?.image || "/images/pfp.png";
  const userEmail = session?.user?.email || "anonymous";

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMenuClick = (action) => {
    if (action === "reportBug") {
      setShowBugModal(true);
    }
  };

  const handleDropdownClick = async (action, href) => {
    if (action === "logout") {
      await signOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } else if (href) {
      setShowDropdown(false);
    }
  };

  return (
    <>
      <aside
        className={`bg-background border border-stroke flex flex-col rounded-lg transition-all duration-300 ease-in-out ${
          isStaticLayout ? "" : "mb-[52px]"
        } ${isCollapsed ? "w-20" : "w-72"}`}
        aria-label="Main navigation sidebar"
      >
        <div className="pt-6 px-4 space-y-10 flex-1">
          {/* Logo */}
          <Link
            href="/"
            className="block px-4 relative h-6 overflow-hidden"
            aria-label="Go to homepage"
          >
            {/* Collapsed Logo */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src="/shepherd-logo.png"
                alt="Shepherd"
                width={24}
                height={24}
                priority
              />
            </div>

            {/* Expanded Logo */}
            <div
              className={`absolute flex items-center transition-all duration-300 ${
                isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <Image
                src="/shepherd-name.png"
                alt="Shepherd"
                width={120}
                height={40}
                priority
              />
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav
            className="w-full flex flex-col gap-2"
            aria-label="Quick actions"
          >
            {MENU_ITEMS.map(
              ({ href, icon: Icon, label, iconColor, external, action }) => {
                const linkClasses = `flex items-center ${
                  isCollapsed ? "justify-center px-2" : "gap-4 px-4"
                } py-2 rounded hover:bg-surface-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary relative group`;

                const content = (
                  <>
                    <Icon
                      className={`text-2xl ${iconColor} flex-shrink-0 transition-transform duration-200`}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-secondary whitespace-nowrap transition-all duration-300 ${
                        isCollapsed
                          ? "opacity-0 w-0 overflow-hidden"
                          : "opacity-100 w-auto"
                      }`}
                    >
                      {label}
                    </span>
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-1.5 bg-primary text-white text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                        {label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-primary" />
                      </div>
                    )}
                  </>
                );

                // Handle button action (e.g., Report a Bug)
                if (action) {
                  return (
                    <button
                      key={label}
                      onClick={() => handleMenuClick(action)}
                      className={linkClasses}
                      aria-label={label}
                    >
                      {content}
                    </button>
                  );
                }

                // Handle external links
                if (external) {
                  return (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClasses}
                      aria-label={`${label} (opens in new tab)`}
                    >
                      {content}
                    </a>
                  );
                }

                // Handle internal links
                return (
                  <Link key={href} href={href} className={linkClasses}>
                    {content}
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        {/* User Info Section */}
        <div
          className={`w-full py-6 mt-auto border-t border-stroke ${
            isCollapsed ? "px-4" : "px-6"
          } relative`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "flex-col gap-2" : "gap-3"
            }`}
          >
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative flex-shrink-0 rounded-md hover:ring-2 hover:ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="User menu"
            >
              <Image
                src={userImage}
                alt={`${userName}'s profile picture`}
                width={36}
                height={36}
                className="rounded-md border border-gray-700"
              />
            </button>

            <div
              className={`flex flex-col min-w-0 transition-all duration-300 ${
                isCollapsed
                  ? "opacity-0 h-0 overflow-hidden w-0"
                  : "opacity-100 h-auto flex-1"
              }`}
            >
              <span className="text-foreground font-medium truncate">
                {userName}
              </span>
              <span className="text-xs text-secondary truncate">
                {userEmail}
              </span>
            </div>

            <button
              onClick={toggleSidebar}
              className={`text-secondary hover:bg-surface-hover transition-all duration-200 focus:outline-none rounded p-1.5 ${
                isCollapsed ? "mt-0 flex justify-center w-10" : "ml-auto"
              }`}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <TbLayoutSidebarLeftExpand
                  className="text-2xl"
                  aria-hidden="true"
                />
              ) : (
                <TbLayoutSidebarLeftCollapse
                  className="text-2xl"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {/* Dropdown Menu */}
          <Dropdown
            isOpen={showDropdown}
            onClose={() => setShowDropdown(false)}
            items={DROPDOWN_ITEMS}
            onItemClick={handleDropdownClick}
            position={isCollapsed ? "top-center" : "top-left"}
          />
        </div>
      </aside>

      {/* Report Bug Modal */}
      <ReportBugModal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
      />
    </>
  );
}
