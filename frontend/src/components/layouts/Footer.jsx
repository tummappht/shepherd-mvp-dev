export default function Footer({ isStaticLayout }) {
  return (
    <footer className="text-white bg-black">
      <div className={`py-4 ${isStaticLayout ? "px-6" : ""}`}>
        <p className="text-sm text-gray-400 text-right">
          © 2025 Shepherd Security Inc, All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
