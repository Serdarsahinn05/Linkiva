"use client";

import { useState } from "react";
import { AtSign } from "lucide-react";

export default function UsernameInput({ defaultValue }: { defaultValue: string }) {
    const [val, setVal] = useState(defaultValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filtered = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
        setVal(filtered);
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <AtSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                    name="username"
                    value={val}
                    onChange={handleChange}
                    placeholder="kullaniciadiniz"
                    className="w-full bg-[#080808] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-white transition-all font-bold text-orange-400"
                />
            </div>

            {/* ANLIK DEĞİŞEN LİNK ÖNİZLEMESİ */}
            <p className="text-[10px] text-gray-600 ml-1 italic font-medium transition-all duration-300">
                Uyarı: Profilin şu adreste görünecek:
                <span className="text-gray-400 ml-1 font-bold">
                    linkiva.space/{val || '...'}
                </span>
            </p>
        </div>
    );
}