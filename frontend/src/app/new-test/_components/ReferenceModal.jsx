import References from "@/components/listItem/References";
import Modal from "@/components/modal/Modal";
import Image from "next/image";
import { TbX } from "react-icons/tb";

const ReferenceModal = ({
  isShow,
  setIsShow,
  selectedReference,
  setSelectedReference,
  handleAttach,
}) => (
  <Modal onChange={setIsShow} isShow={isShow}>
    <div className="relative flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setIsShow(false)}
        className="absolute top-0 right-0 text-secondary hover:bg-surface-hover transition-all duration-200 focus:outline-none rounded p-1.5 ml-auto"
        aria-label="Close modal"
      >
        <TbX />
      </button>

      <div className="flex flex-col gap-1">
        <h2 className="text-md font-semibold">References</h2>
        <p className="text-secondary">
          Identify smart contracts with similar vulnerabilities to support your
          hypothesis.
        </p>
      </div>

      <References
        clicked={selectedReference}
        setClicked={setSelectedReference}
      />

      <button
        type="button"
        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-offset h-12"
        onClick={handleAttach}
        disabled={!selectedReference}
        aria-label="Attach selected reference"
      >
        Attach
      </button>
    </div>
  </Modal>
);

export default ReferenceModal;
