import Link from "next/link";
import PropTypes from "prop-types";

export default function CollectionPanel({
  title,
  description,
  children,
  href,
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div>
          <p className="text-xl font-semibold">{title}</p>
          <p className="text-secondary">{description}</p>
        </div>
        {href ? (
          <Link href={href}>
            <button
              type="button"
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg transition-all"
            >
              +
            </button>
          </Link>
        ) : (
          <></>
        )}
      </div>
      {children}
    </>
  );
}

CollectionPanel.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  href: PropTypes.string,
};
