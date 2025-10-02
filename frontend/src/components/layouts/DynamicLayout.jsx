import { SocketStatusProvider } from "@/context/SocketStatusContext";
import Sidebar from "@/components/layouts/Sidebar";
import Footer from "@/components/layouts/Footer";
import PropTypes from "prop-types";

export const metadata = {
  title: "Shepherd Security",
};

export default function DynamicLayout({ children }) {
  return (
    <div className="flex w-screen h-screen gap-4 p-6 pr-0 pb-0 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-auto pr-6">
        <SocketStatusProvider>
          <main className="flex-1 flex flex-col">{children}</main>
        </SocketStatusProvider>
        <Footer />
      </div>
    </div>
  );
}

DynamicLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
