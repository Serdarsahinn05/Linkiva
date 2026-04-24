"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Link2, ExternalLink, Trash2, Edit3, Power, GripVertical } from "lucide-react";
import { toggleLinkStatus } from "@/lib/actions";

export function SortableLinkItem({ link, activeMenuId, setActiveMenuId, setLinkToDelete, setLinkToEdit, menuRef }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: transition || 'transform 250ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        zIndex: isDragging ? 100 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`col-span-1 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-6 hover:border-gray-700 transition-all group flex flex-col justify-between min-h-[220px] relative ${
                isDragging ? 'shadow-2xl border-white/20 scale-[1.05] z-50 ring-1 ring-white/10' : ''
            } ${!link.isActive ? 'opacity-40' : 'opacity-100'}`}
        >
            <div className="flex justify-between items-start">
                <div {...attributes} {...listeners} className="p-2 -ml-2 text-gray-700 hover:text-white cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} />
                </div>
                {/* Menü Butonu */}
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === link.id ? null : link.id); }} className="p-2 text-gray-500 hover:text-white bg-[#080808] rounded-full border border-transparent hover:border-white/10 transition-all">
                        <MoreHorizontal size={20} />
                    </button>
                    {activeMenuId === link.id && (
                        <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl shadow-2xl z-[200] overflow-hidden py-2 animate-in fade-in zoom-in duration-150 text-left">
                            <button onClick={async () => { await toggleLinkStatus(link.id, link.isActive); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-[#111] hover:text-white transition-colors">
                                <Power size={16} className={link.isActive ? "text-blue-500" : "text-gray-600"} />
                                {link.isActive ? "Pasif Yap" : "Aktif Et"}
                            </button>
                            <button onClick={() => { setLinkToEdit(link); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-[#111] hover:text-white transition-colors">
                                <Edit3 size={16} /> Düzenle
                            </button>
                            <div className="h-[1px] bg-[#1A1A1A] my-1 mx-2" />
                            <button onClick={() => { setLinkToDelete({ id: link.id, title: link.title }); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors font-bold">
                                <Trash2 size={16} /> Sil
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 py-2">
                <div className="w-14 h-14 bg-[#111] rounded-2xl flex items-center justify-center overflow-hidden border border-[#1A1A1A] mb-3">
                    {link.thumbnail ? <img src={link.thumbnail} alt="" className="w-full h-full object-cover p-2" /> : <Link2 size={24} className="text-gray-500" />}
                </div>
                <h3 className="font-bold text-white text-center truncate max-w-full px-2">{link.title}</h3>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-black bg-[#111] text-gray-400 px-3 py-1 rounded-lg border border-[#1A1A1A] tracking-widest uppercase">
                    {link.clickCount} TIK
                </span>
                <ExternalLink size={12} className="text-gray-700" />
            </div>
        </div>
    );
}