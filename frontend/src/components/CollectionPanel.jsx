import Link from "next/link";
import PropTypes from "prop-types";

export default function CollectionPanel({
  title,
  prefixIcon,
  description,
  children,
  href,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            {prefixIcon}
            <p className="text-xl font-semibold">{title}</p>
          </div>
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
    </div>
  );
}

CollectionPanel.propTypes = {
  title: PropTypes.string,
  prefixIcon: PropTypes.node,
  description: PropTypes.string,
  children: PropTypes.node,
  href: PropTypes.string,
};
