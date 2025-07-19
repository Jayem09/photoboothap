// components/ui/Modal.tsx
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xl text-gray-500"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
