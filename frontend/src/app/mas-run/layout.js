import "../globals.css";
import PropTypes from "prop-types";
import StaticLayout from "@/components/layouts/StaticLayout";

export const metadata = {
  title: "Shepherd Security: Diagram",
};

export default function Layout({ children }) {
  return <StaticLayout>{children}</StaticLayout>;
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
