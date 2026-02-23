import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
// @ts-ignore
import { saveAs } from "file-saver";
import {
    Scale,
    Search,
    Plus,
    Download,
    Edit,
    Trash2,
    Calendar,
    Settings,
    Building2,
    FileCheck,
} from "lucide-react";
import {
    VanBanPhapLy,
    LoaiVanBanPhapLy,
    HopDong
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LegalDocumentModal from "@/components/modals/legal-document-modal";
import LegalDocTypeManagerModal from "@/components/modals/legal-document-type-manager-modal";

export default function LegalDocuments() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<VanBanPhapLy | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading } = useQuery<VanBanPhapLy[]>({
        queryKey: ["/api/van-ban-phap-ly", searchTerm],
        queryFn: async ({ queryKey }) => {
            const [_key, search] = queryKey;
            const url = search ? `/api/van-ban-phap-ly?search=${search}` : "/api/van-ban-phap-ly";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: documentTypes = [] } = useQuery<LoaiVanBanPhapLy[]>({
        queryKey: ["/api/loai-van-ban-phap-ly"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/van-ban-phap-ly/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/van-ban-phap-ly"] });
            toast({ title: "Thành công", description: "Văn bản đã được xóa" });
        },
    });

    const getContractInfo = (id: number | null) => {
        return contracts.find((c) => c.id === id);
    };

    const getDocTypeName = (id: number) => {
        return documentTypes.find((l) => l.id === id)?.tenLoaiPhapLy || "N/A";
    };

    // Group documents by contract for display
    const groupedDocs = useMemo(() => {
        const map = new Map<number, { contract?: HopDong; items: VanBanPhapLy[] }>();

        documents.forEach((doc) => {
            const key = doc.hopDongId;
            if (!map.has(key)) {
                map.set(key, {
                    contract: getContractInfo(key),
                    items: []
                });
            }
            map.get(key)!.items.push(doc);
        });

        return Array.from(map.values());
    }, [documents, contracts]);

    const handleExportAll = () => {
        const exportData = documents.map((doc) => {
            const contract = getContractInfo(doc.hopDongId);
            return {
                "Số hợp đồng": contract?.soHdNgoai || contract?.soHdNoi || "N/A",
                "Tên hợp đồng": contract?.ten || "N/A",
                "Tên văn bản": doc.tenVanBan,
                "Loại văn bản": getDocTypeName(doc.loaiVanBanId),
                "Ngày văn bản": doc.ngayVanBan,
                "Ghi chú": doc.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "VanBanPhapLy");
        const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(new Blob([buf]), "tat_ca_van_ban_phap_ly.xlsx");
    };

    const handleExportContract = (groupDocs: VanBanPhapLy[], contract?: HopDong) => {
        const exportData = groupDocs.map((doc) => ({
            "Số hợp đồng": contract?.soHdNgoai || contract?.soHdNoi || "N/A",
            "Tên hợp đồng": contract?.ten || "N/A",
            "Tên văn bản": doc.tenVanBan,
            "Loại văn bản": getDocTypeName(doc.loaiVanBanId),
            "Ngày văn bản": doc.ngayVanBan,
            "Ghi chú": doc.ghiChu,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "VanBanPhapLy");
        const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(new Blob([buf]), `van_ban_${contract?.soHdNgoai || 'hop_dong'}.xlsx`);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Văn bản pháp lý"
                    subtitle="Tra cứu và quản lý các văn bản pháp lý theo hợp đồng"
                    onCreateContract={() => { }}
                />

                <main className="flex-1 overflow-auto p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Tìm theo số hợp đồng hoặc tên văn bản..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="w-4 h-4 mr-2" /> Thêm văn bản
                            </Button>
                            <Button variant="outline" onClick={handleExportAll}>
                                <Download className="w-4 h-4 mr-2" /> Xuất tất cả
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-slate-600 hover:text-indigo-600"
                                onClick={() => setIsTypeManagerOpen(true)}
                            >
                                <Settings className="w-4 h-4 mr-2" /> Cấu hình loại
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse h-40" />
                            ))}
                        </div>
                    ) : groupedDocs.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Không tìm thấy văn bản pháp lý nào</p>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {groupedDocs.map((group, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {group.contract ? `${group.contract.soHdNgoai || group.contract.soHdNoi} - ${group.contract.ten}` : "Hợp đồng không xác định"}
                                                </h3>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {group.items.length} VĂN BẢN
                                                </p>
                                            </div>
                                        </div>
                                        {group.contract && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-indigo-600"
                                                onClick={() => handleExportAll()}
                                            >
                                                <Download className="w-4 h-4 mr-2" /> Xuất Excel
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {group.items.map((doc) => (
                                            <Card key={doc.id} className="overflow-hidden border-slate-200 hover:border-indigo-300 transition-colors shadow-sm bg-white">
                                                <CardHeader className="p-4 bg-slate-50/50 border-b">
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="bg-white text-indigo-700 border-indigo-200 uppercase text-[10px] px-2 py-0.5">
                                                            {getDocTypeName(doc.loaiVanBanId)}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500"
                                                                onClick={() => {
                                                                    setSelectedDoc(doc);
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-400"
                                                                onClick={() => {
                                                                    if (confirm("Xóa văn bản này?")) deleteMutation.mutate(doc.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <CardTitle className="text-base font-bold text-slate-800 mt-2 flex items-center gap-2">
                                                        <FileCheck className="w-4 h-4 text-emerald-500" /> {doc.tenVanBan}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 bg-white">
                                                    <div className="grid grid-cols-1 gap-y-3">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">Ngày văn bản:</span>
                                                            <span className="font-medium">{doc.ngayVanBan || "N/A"}</span>
                                                        </div>
                                                        <div className="text-sm border-t pt-2 mt-1">
                                                            <p className="text-slate-500 italic leading-relaxed">
                                                                {doc.ghiChu || "Không có ghi chú"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <LegalDocumentModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />

                <LegalDocTypeManagerModal
                    isOpen={isTypeManagerOpen}
                    onClose={() => setIsTypeManagerOpen(false)}
                />

                {selectedDoc && (
                    <LegalDocumentModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedDoc(null);
                        }}
                        document={selectedDoc}
                    />
                )}
            </div>
        </div>
    );
}
