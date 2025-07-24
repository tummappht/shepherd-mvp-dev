'use client';

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Header() {
    const pathname = usePathname();

    let title;
    let image;
    if (pathname === "/dashboard") {
        title = "Dashboard";
        image = "/shepherd-logo.png"; {/* Change to component from figma*/}
    } else if (pathname === "/new-test") {
        title = "New Test";
        image = "/shepherd-logo.png"; {/* Change to component from figma*/}
    } else if (pathname === "/run-test") {
        title = "Run Test";
        image = "/shepherd-logo.png"; {/* Change to component from figma*/}
    } else {
        title = "Welcome";
        image = "/shepherd-logo.png"; {/* Change to component from figma*/}
    }

    return (
        <div className="w-full h-24 bg-[#1a1a1a] flex items-center px-6 border-b border-[#353535]">
            <div className="flex flex-rol pl-6 gap-x-3">
                <Image
                    src={image}
                    height={30}
                    width={30}
                    alt={title}
                />
                <h1 className="text-xl font-semibold text-white">{title}</h1>
            </div>
        </div>
    )
}