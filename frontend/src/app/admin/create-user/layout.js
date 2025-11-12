import "../../globals.css";
import PropTypes from "prop-types";
import StaticLayout from "@/components/layouts/StaticLayout";

export const metadata = {
  title: "Shepherd Security: Create User",
};

export default function Layout({ children }) {
  return <StaticLayout isSidebar={false}>{children}</StaticLayout>;
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
