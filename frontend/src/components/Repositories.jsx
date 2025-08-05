import Image from "next/image";

export default function Repositories() {
    const repositories = [
        {name: "thaveesi/01/files"},
        {name: "thaveesi/02/files"},
        {name: "thaveesi/03/files"},
        {name: "thaveesi/04/files"},
        {name: "thaveesi/05/files"},
    ]

    return (
        <div className="flex flex-col space-y-2">
            {repositories.map((repo) => (
                <div
                    key={repo.name}
                    className="flex flex-row border border-[#232323] rounded-lg px-4 py-2 items-center justify-between cursor-pointer bg-[#141414]"
                >
                    <div className="flex flex-row space-x-2 items-center">
                        <Image
                            src="/images/github.png"
                            width={20}
                            height={20}
                            alt="DeFiHackLabs"
                        />
                        <p className="text-sm text-white">{repo.name}</p>
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