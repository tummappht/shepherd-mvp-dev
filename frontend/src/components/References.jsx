"use client";
import Image from "next/image";

export default function References({ clicked, setClicked }) {
    const references = [
        {name: "Hash-collisions.sol"},
        {name: "Invariant.sol"},
        {name: "ReadOnlyReentrancy.sol"},
    ];

    return (
        <div className="flex flex-col space-y-2">
            {references.map((reference) => (
                <div
                    key={reference.name}
                    className={`flex flex-row border border-[#232323] rounded-lg px-4 py-2 items-center justify-between cursor-pointer
                        ${clicked === reference.name ? "bg-[#df153e]" : "bg-[#141414]"}`}
                    onClick={() => setClicked(clicked === reference.name ? null : reference.name)}
                >
                    <div className="flex flex-row space-x-2 items-center">
                        <Image
                            src="/images/defi.png"
                            width={40}
                            height={40}
                            alt="DeFiHackLabs"
                        />
                        <Image
                            src="/images/file.png"
                            width={20}
                            height={20}
                            alt="File"
                        />
                        <p className="text-sm">{reference.name}</p>
                    </div>
                    <Image
                        src="/images/arrow.png"
                        width={15}
                        height={15}
                        alt="Expand Arrow"
                    />
                </div>
            ))}
        </div>
    );
}