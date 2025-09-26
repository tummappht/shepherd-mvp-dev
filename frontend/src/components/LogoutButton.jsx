"use client";
import { signOut } from "next-auth/react";
import { FaSignOutAlt } from "react-icons/fa";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="h-10 w-10 flex items-center justify-center rounded-md"
    >
      <FaSignOutAlt className="text-lg" />
    </button>
  );
}
