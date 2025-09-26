"use client";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { useSession } from "next-auth/react";

export default async function Header() {
  const { data: session } = useSession();

  const name = session?.user?.name || "Guest";
  const image = session?.user?.image || "/images/pfp.png";

  return (
    <div className="bg-surface border-b border-[#353535]">
      <div className="container mx-auto h-20 px-4 flex items-center justify-between ">
        <div className="flex flex-row gap-x-3">
          <Link href="/">
            <Image
              src="/shepherd-name.png"
              height={70}
              width={140}
              alt="Shepherd Logo"
            />
          </Link>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <Image
            src={image}
            height={30}
            width={30}
            alt="Profile Picture"
            className="rounded-full"
          />
          <div className="flex flex-col">
            <p className="text-sm">{name}</p>
            <p className="text-secondary text-sm">
              {session?.user?.email ? `@${session.user.email}` : "@anonymous"}
            </p>
          </div>
          {session && <LogoutButton />}
        </div>
      </div>
    </div>
  );
}
