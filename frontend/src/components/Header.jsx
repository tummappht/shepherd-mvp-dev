'use client';
import Image from "next/image";

export default function Header() {
    return (
        <div className="w-full h-24 bg-[#1a1a1a] flex items-center px-6 border-b border-[#353535]">
            <div className="flex flex-row pl-6 gap-x-3">
                <Image
                    src="/shepherd-name.png"
                    height={70}
                    width={140}
                    alt="Shepherd Logo"
                />
            </div>
        </div>
    )
}