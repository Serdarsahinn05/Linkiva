"use client";

import { X, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    linkTitle: string;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, linkTitle }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-sm bg-black border border-red-900/30 rounded-[2.5rem] p-8 relative shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]">

                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle size={32} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Emin misin?</h2>
                        <p className="text-gray-500 text-sm mt-2">
                            <span className="text-white font-bold italic">"{linkTitle}"</span> bağlantısı kalıcı olarak silinecek. Bu işlem geri alınamaz.
                        </p>
                    </div>

                    <div className="flex flex-col w-full gap-2 pt-4">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            SİL GİTSİN
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-transparent text-gray-500 hover:text-white font-bold py-4 rounded-2xl transition-all"
                        >
                            VAZGEÇ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}