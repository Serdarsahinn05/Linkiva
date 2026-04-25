"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, X, Download } from "lucide-react";

export default function QRCodeModal({ username }: { username: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const profileUrl = `https://linkiva.vercel.app/${username}`;

    // QR Kodu PNG olarak indirme fonksiyonu
    const downloadQRCode = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `${username}-linkiva-qr.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <>
            {/* 1. SİDEBAR'DA GÖRÜNECEK KÜÇÜK AÇMA BUTONU */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(true);
                }}

                className="flex items-center justify-center p-4 bg-[#111] hover:bg-[#1A1A1A] border border-[#1A1A1A] rounded-2xl transition-all group shrink-0 cursor-pointer shadow-lg"
                title="QR Kodunu Oluştur"
            >

                <QrCode size={20} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>

            {/* 2. BUTONA TIKLANINCA AÇILAN SİYAH EKRAN (MODAL) */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#080808] border border-[#1A1A1A] rounded-[2.5rem] p-8 max-w-sm w-full relative flex flex-col items-center shadow-2xl">

                        {/* X (KAPATMA) BUTONU */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center mb-4">
                            <QrCode size={24} className="text-white" />
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">QR Kodun Hazır.</h2>
                        <p className="text-sm text-gray-500 mb-8 text-center font-medium">
                            Bu kodu okutan herkes doğrudan senin Linkiva profiline yönlendirilecek.
                        </p>

                        {/* QR KODUN ÇİZİLDİĞİ YER */}
                        <div className="bg-white p-6 rounded-3xl mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)]" ref={qrRef}>
                            <QRCodeCanvas
                                value={profileUrl}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"H"}
                                includeMargin={false}
                            />
                        </div>

                        <button
                            onClick={downloadQRCode}
                            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-[0.98] uppercase tracking-widest text-xs cursor-pointer"
                        >
                            <Download size={18} />
                            PNG OLARAK İNDİR
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}