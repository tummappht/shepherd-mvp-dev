export default function NewTest() {
    return (
        <div className="bg-black h-full flex flex-col p-16 space-y-5">
            <div className="flex flex-col">
                <div className="w-full flex flex-row justify-between items-center">
                <p className="text-medium">Create a New Test</p>
                    <button className="bg-[#df153e] py-2 px-6 rounded-full">+ New Test</button>
                </div>
                <p>Connected to Github</p>
            </div>
            <div className="flex flex-col bg-[#1a1a1a] border-[#353535] rounded-lg p-6">
                <p>Select a repository</p>
                <div>
                    {/* Insert repo component here */}
                </div>
            </div>
            <div className="flex flex-col">
                <p>Project Description</p>
                <p>Please write a short description of your project or upload a white paper.</p>
            </div>
        </div>
    );
};