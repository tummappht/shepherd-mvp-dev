"use client";
import { signOut } from "next-auth/react";
import { FaSignOutAlt } from "react-icons/fa";
import { clearAuthToken } from "@/services/utils";

export default function LogoutButton() {
  const handleLogout = () => {
    clearAuthToken();
    signOut();
  };

  return (
    <button
      onClick={handleLogout}
      className="h-10 w-10 flex items-center justify-center rounded-md"
    >
      <FaSignOutAlt className="text-lg" />
    </button>
  );
}
