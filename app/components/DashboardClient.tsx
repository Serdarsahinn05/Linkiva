"use client";

import { Plus, BarChart2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { DndContext, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import AddLinkModal from "@/app/components/AddLinkModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EditLinkModal from "./EditLinkModal";
import { SortableLinkItem } from "./SortableLinkItem";
import { deleteLink, updateLinksOrder } from "@/lib/actions";

export default function DashboardClient({ initialLinks }: { initialLinks: any[] }) {
    const [links, setLinks] = useState(initialLinks);
    const [mounted, setMounted] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState<any | null>(null);
    const [linkToEdit, setLinkToEdit] = useState<any | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { setLinks(initialLinks); }, [initialLinks]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = links.findIndex(l => l.id === active.id);
        const newIndex = links.findIndex(l => l.id === over.id);

        const newOrder = arrayMove(links, oldIndex, newIndex);
        setLinks(newOrder);
        await updateLinksOrder(newOrder.map(l => l.id));
    };

    if (!mounted) return <div className="max-w-6xl mx-auto p-12 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Linkiva Yükleniyor...</div>;

    const totalClicks = links.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <h1 className="text-4xl font-black text-white tracking-tight">Linklerim.</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div onClick={() => setIsAddModalOpen(true)} className="md:col-span-2 lg:col-span-2 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-[#080808] transition-all min-h-[240px]">
                    <div className="w-16 h-16 bg-white/5 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-all"><Plus size={32} /></div>
                    <h2 className="text-white text-2xl font-bold">Yeni Link Ekle</h2>
                </div>

                <div className="md:col-span-1 lg:col-span-2 bg-black border border-[#1A1A1A] rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[240px] shadow-xl text-left">
                    <div className="flex justify-between items-start">
                        <div className="p-4 bg-[#111] text-white rounded-2xl w-fit"><BarChart2 size={24} /></div>
                        {/* YEŞİL CANLI BADGE */}
                        <span className="flex items-center gap-2 text-sm font-bold bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            Aktif
                        </span>
                    </div>
                    <div>
                        <h3 className="text-gray-500 font-medium text-sm uppercase tracking-widest">Toplam Tıklanma</h3>
                        <p className="text-7xl font-black text-white mt-1 leading-none">{totalClicks.toLocaleString()}</p>
                    </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
                    <SortableContext items={links.map(l => l.id)} strategy={rectSortingStrategy}>
                        {links.map((link) => (
                            <SortableLinkItem
                                key={link.id} link={link} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
                                setLinkToDelete={setLinkToDelete} setLinkToEdit={setLinkToEdit} menuRef={menuRef}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            <AddLinkModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditLinkModal isOpen={!!linkToEdit} onClose={() => setLinkToEdit(null)} link={linkToEdit} />
            <DeleteConfirmModal
                isOpen={!!linkToDelete} onClose={() => setLinkToDelete(null)} linkTitle={linkToDelete?.title || ""}
                onConfirm={async () => { if(linkToDelete) await deleteLink(linkToDelete.id); }}
            />
        </div>
    );
}