import { SocketStatusProvider } from "@/context/SocketStatusContext";
import Sidebar from "@/components/layouts/Sidebar";
import Footer from "@/components/layouts/Footer";
import PropTypes from "prop-types";

export const metadata = {
  title: "Shepherd Security",
};

export default function StaticLayout({ children }) {
  return (
    <div className="flex flex-col w-screen h-screen bg-black">
      <div className="flex-1 flex gap-4 p-6 pb-0 overflow-hidden">
        <Sidebar isStaticLayout />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
      <Footer isStaticLayout />
    </div>
  );
}

StaticLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
