import PropTypes from "prop-types";
import TreeSelect from "../treeSelect/TreeSelect";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MESSAGE_TYPES, CONTENT_TYPES } from "@/hook/useWebSocketMessages";
import RunAnotherMasRadio from "@/app/mas-run/_components/RunAnotherMasRadio";

export default function MessageRenderer({ msg }) {
  const isFromUser = msg.from === "user";

  if (isFromUser) {
    const isOption = msg.type === CONTENT_TYPES.OPTION;
    const isRadio = msg.type === CONTENT_TYPES.RADIO;

    if (isOption) {
      try {
        // Remove trailing comma and parse JSON
        const cleanedText = msg.text.replace(/,\s*$/, "");
        const parsedOptions = JSON.parse(cleanedText);
        return <TreeSelect options={parsedOptions} readOnly />;
      } catch (error) {
        console.error("Failed to parse options:", error, msg.text);
        return (
          <span className="whitespace-pre-wrap bg-background-light text-white border border-stroke-light py-3 px-5 rounded-lg w-full">
            {msg.text}
          </span>
        );
      }
    }

    if (isRadio) {
      return <RunAnotherMasRadio value={msg.text} isReadOnly />;
    }

    return (
      <span className="whitespace-pre-wrap bg-background-light text-white border border-stroke-light py-3 px-5 rounded-lg w-full">
        {msg.text}
      </span>
    );
  }

  const isWhiteText =
    msg.type === MESSAGE_TYPES.PROMPT || msg.type === MESSAGE_TYPES.END;
  const textColor = isWhiteText ? "text-white" : "text-secondary";

  //OLD REPORTER FORMAT
  const isRenderAsMarkdown = Boolean(msg.text?.includes("|"));
  if (isRenderAsMarkdown) {
    return (
      <div className={`pl-7 ${textColor}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
      </div>
    );
  }

  const isTable =
    msg.type === CONTENT_TYPES.TABLE && msg.text?.type === "table";
  if (isTable) {
    const header = msg.text.header || "";
    const data = msg.text.data || [];
    const description = msg.text.description || "";

    return (
      <div className={`${textColor} pl-7 markdown-content`}>
        <div className="flex flex-col border border-secondary p-4 gap-4">
          <span>{header}</span>
          <div className="flex flex-col gap-7">
            {data.map((row, rowIndex) => (
              <table key={rowIndex} className="w-full border-collapse">
                <tbody>
                  {row.details.map((detail, detailIndex) => (
                    <tr key={detailIndex}>
                      <td className="border border-white p-3 text-white">
                        <p className="font-extrabold mb-1">{detail.key}:</p>
                        <p className="m-0">{detail.value}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
          <span>{description}</span>
        </div>
      </div>
    );
  }

  return (
    <span className={`whitespace-pre-wrap pl-7 ${textColor}`}>{msg.text}</span>
  );
}

MessageRenderer.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.string,
    text: PropTypes.any,
    type: PropTypes.string,
  }).isRequired,
};
