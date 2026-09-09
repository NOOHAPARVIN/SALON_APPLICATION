"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

type ModalType = "info" | "success" | "warning" | "error" | "danger";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  isConfirm: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string, type?: ModalType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: ModalType) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    isConfirm: false,
  });

  const showAlert = (title: string, message: string, type: ModalType = "info") => {
    setModal({ isOpen: true, title, message, type, isConfirm: false });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ModalType = "warning") => {
    setModal({ isOpen: true, title, message, type, isConfirm: true, onConfirm });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) modal.onCancel();
    closeModal();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center justify-center mb-6 text-center">
              <div className={`p-3 rounded-full mb-4 ${
                modal.type === "success" ? "bg-green-100 text-green-500" :
                modal.type === "error" || modal.type === "danger" ? "bg-red-100 text-red-500" :
                modal.type === "warning" ? "bg-amber-100 text-amber-500" :
                "bg-blue-100 text-blue-500"
              }`}>
                {modal.type === "success" && <FaCheckCircle size={28} />}
                {(modal.type === "error" || modal.type === "danger") && <FaTimesCircle size={28} />}
                {modal.type === "warning" && <FaExclamationTriangle size={28} />}
                {modal.type === "info" && <FaInfoCircle size={28} />}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{modal.title}</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                {modal.message}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              {modal.isConfirm ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 flex-1 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`px-5 py-2.5 flex-1 rounded-xl font-bold text-white transition-all text-sm ${
                      modal.type === "warning" || modal.type === "error" || modal.type === "danger" ? "bg-red-500 hover:bg-red-600" :
                      modal.type === "success" ? "bg-green-500 hover:bg-green-600" :
                      "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className={`px-5 py-2.5 w-full rounded-xl font-bold text-white transition-all text-sm ${
                    modal.type === "error" || modal.type === "danger" ? "bg-red-500 hover:bg-red-600" :
                    modal.type === "success" ? "bg-green-500 hover:bg-green-600" :
                    modal.type === "warning" ? "bg-amber-500 hover:bg-amber-600" :
                    "bg-[#ff6b35] hover:bg-[#e85a25]"
                  }`}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
