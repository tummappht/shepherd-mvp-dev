import References from "@/components/listItem/References";
import Modal from "@/components/modal/Modal";
import Image from "next/image";

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
        className="absolute top-0 right-0 p-1 rounded hover:bg-gray-200"
        aria-label="Close modal"
      >
        <Image src="/images/x.png" alt="Close" width={16} height={16} />
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
        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-offset"
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
