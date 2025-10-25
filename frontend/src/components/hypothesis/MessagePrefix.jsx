import PropTypes from "prop-types";
import { MESSAGE_TYPES, CONTENT_TYPES } from "@/hook/useWebSocketMessages";

export default function MessagePrefix({ msg, index, messages }) {
  const isOption = msg.type === CONTENT_TYPES.OPTION;
  const isTable = msg.type === CONTENT_TYPES.TABLE;
  const isFromUser = msg.from === "user";

  if (isFromUser || isOption || isTable) {
    return null;
  }

  const isPrompt = msg.type === MESSAGE_TYPES.PROMPT;
  const isLastMessage = index === messages.length - 1;
  const showConnectorLine = !isLastMessage && !isPrompt;
  const circleColor = isPrompt ? "border-primary" : "border-white";

  return (
    <>
      <span
        className={`border ${circleColor} w-2 h-2 absolute top-2 left-2 rounded-full`}
      />
      {showConnectorLine && (
        <span className="border border-secondary border-dashed absolute top-6 left-[11px] h-[calc(100%-1rem)]" />
      )}
    </>
  );
}

MessagePrefix.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  messages: PropTypes.array.isRequired,
};
