import Image from "next/image";

export default function NewTest() {
    return (
        <div className="bg-black h-full flex flex-col py-8 px-24 space-y-10">
            <div className="flex flex-col space-y-6">
                <div className="w-full flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <p className="text-lg">Repository URL</p>
                        <p className="text-[#595959]">Insert the repository link you&apos;d like to explore</p>
                    </div>
                </div>
                <input
                    type="text"
                    className="w-full p-4 border border-[#232323] rounded-md bg-[#0C0C0C] text-[#595959] placeholder-[#595959] placeholder:italic"
                    placeholder="Enter URL..."
                />
            </div>
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col">
                    <p className="text-lg">Project description</p>
                    <p className="text-[#595959]">Please provide the protocol documentation to help better inform the repository.</p>
                </div>
                <textarea
                    type="text"
                    className="w-full p-4 h-40 border border-[#232323] rounded-md bg-[#0C0C0C] text-[#595959] placeholder-[#595959] placeholder:italic"
                    placeholder="Insert documentation..."
                />
                <div className="w-fit flex flex-row items-center justify-center px-4 py-2 space-x-2 rounded-lg bg-[#DF153E]">
                    <Image
                        src="/images/she.png"
                        height={20}
                        width={20}
                        alt="Upload"
                    />
                    <p className="text-sm">Upload White Paper</p>
                </div>
            </div>
            <div className="flex flex-col space-y-6">
                <div className="w-full flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <p className="text-lg">Select an Environment</p>
                        <p className="text-[#595959]">Please select the environment where you&apos;d like to deploy the smart contracts from the repository indicated.</p>
                    </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-row space-x-2">
                        <button className="bg-[#0C0C0C] border border-[#232323] px-5 py-3 rounded-lg hover:scale-105">Local</button>
                        <button className="bg-[#0C0C0C] border border-[#232323] px-5 py-3 rounded-lg hover:scale-105">Testnet</button>
                    </div>
                    <button className="bg-[#df153e] px-6 py-3 rounded-lg hover:scale-105">Next</button>
                </div>
            </div>
        </div>
    );
};