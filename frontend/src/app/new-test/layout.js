import "../globals.css";
import PropTypes from "prop-types";
import DynamicLayout from "@/components/layouts/DynamicLayout";

export const metadata = {
  title: "Shepherd Security: Create New Test",
};

export default function Layout({ children }) {
  return <DynamicLayout>{children}</DynamicLayout>;
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
