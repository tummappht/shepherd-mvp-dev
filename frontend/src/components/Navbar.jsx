import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="h-screen w-60 border-r border-[#353535] flex flex-col px-8 py-8 fixed bg-[#1a1a1a]">
            <div className="flex flex-col gap-y-10">
                <Image
                    src="/shepherd-logo.png"
                    width={30}
                    height={30}
                    alt="Shepherd Logo"
                />
                <ul className="space-y-6 font-medium text-white">
                    <li><a href="#">Dashboard</a></li>
                    <li><a href="#">Reports</a></li>
                    <li><a href="#">Integrations</a></li>
                </ul>
                <hr className="border-[#353535]"/>
                <ul className="space-y-6 font-medium text-white">
                    <li><a href="#">Help</a></li>
                    <li><a href="#">Settings</a></li>
                    <li><a href="#">Account</a></li>
                    <li><a href="#">Join Telegram</a></li>
                </ul>
            </div>
        </nav>
    );
};