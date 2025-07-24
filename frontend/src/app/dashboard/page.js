import Link from "next/link";

export default function Dashboard() {
    return (
        <div className="bg-black h-full flex flex-col p-16 space-y-20">
            <div className="w-full flex flex-row justify-between items-center">
                <p className="text-medium">Previous Tests</p>
                <Link href="/new-test">
                    <button className="bg-[#df153e] py-2 px-6 rounded-full hover:scale-105">+ New Test</button>
                </Link>
            </div>
            <div className="flex flex-col">
                <p>Completed Tests</p>
                <p>Access all your completed pentests.</p>
            </div>
        </div>
  );
}