export default function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-2 rounded-lg text-sm bg-[#141414] text-gray-300">
        <div className="flex space-x-1 items-center">
          <div className="flex space-x-1 ml-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
            <div
              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
