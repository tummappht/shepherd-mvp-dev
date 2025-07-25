import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-black h-full flex flex-col py-16 px-24 space-y-10">
      <div className="flex flex-col space-y-6">
        <div className="w-full flex flex-row justify-between items-center">
            <div className="flex flex-col">
              <p className="text-lg">My Repositories</p>
              <p className="text-[#595959]">Access all your previous repositories and hypotheses.</p>
            </div>
            <Link href="/new-test">
                <button className="bg-[#df153e] px-4 py-2 rounded-lg hover:scale-105">+</button>
            </Link>
        </div>
        <div className="bg-[#0C0C0C] p-8">
          <p className="text-[#595959]">No repositories yet</p>
        </div>
      </div>
      <div className="flex flex-col space-y-6">
        <div className="w-full flex flex-row justify-between items-center">
            <div className="flex flex-col">
              <p className="text-lg">References</p>
              <p className="text-[#595959]">Identify smart contracts with similar vulnerabilities to support your hypothesis.</p>
            </div>
              <button className="bg-[#df153e] px-4 py-2 rounded-lg hover:scale-105">+</button>
        </div>
        <div className="bg-[#0C0C0C] p-8">
          <p className="text-[#595959]">No references yet</p>
        </div>
      </div>
    </div>
  );
}
