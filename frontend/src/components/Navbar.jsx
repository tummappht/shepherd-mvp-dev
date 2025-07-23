export default function Navbar() {
    return (
        <nav className="h-screen w-60 bg-[#0d0d0d] text-white flex flex-col px-4 py-8 fixed">
            <ul className="space-y-4">
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Reports</a></li>
                <li><a href="#">Integrations</a></li>
                <li><a href="#">Help</a></li>
                <li><a href="#">Settings</a></li>
                <li><a href="#">Account</a></li>
                <li><a href="#">Join Telegram</a></li>
            </ul>
        </nav>
    );
};