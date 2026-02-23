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
    Plane,
    Search,
    Plus,
    Download,
    Edit,
    Trash2,
    Settings,
    Building2,
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react";
import {
    DoanRaVao,
    LoaiDoanRaVao,
    HopDong,
    LoaiTien
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MissionModal from "@/components/modals/mission-modal";
import MissionTypeManagerModal from "@/components/modals/mission-type-manager-modal";

export default function Missions() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
    const [selectedMission, setSelectedMission] = useState<DoanRaVao | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: missions = [], isLoading } = useQuery<DoanRaVao[]>({
        queryKey: ["/api/doan-ra-vao", searchTerm],
        queryFn: async ({ queryKey }) => {
            const [_key, search] = queryKey;
            const url = search ? `/api/doan-ra-vao?search=${search}` : "/api/doan-ra-vao";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: missionTypes = [] } = useQuery<LoaiDoanRaVao[]>({
        queryKey: ["/api/loai-doan-ra-vao"],
    });

    const { data: loaiTien = [] } = useQuery<LoaiTien[]>({
        queryKey: ["/api/loai-tien"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/doan-ra-vao/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/doan-ra-vao"] });
            toast({ title: "Thành công", description: "Thông tin đoàn đã được xóa" });
        },
    });

    const getContractInfo = (id: number | null) => {
        return contracts.find((c) => c.id === id);
    };

    const getMissionType = (id: number) => {
        return missionTypes.find((l) => l.id === id);
    };

    const getCurrencyName = (id: number | null) => {
        return loaiTien.find((t) => t.id === id)?.ten || "N/A";
    };

    // Group missions by contract
    const groupedMissions = useMemo(() => {
        const map = new Map<number, { contract?: HopDong; items: DoanRaVao[] }>();

        missions.forEach((mission) => {
            const key = mission.hopDongId;
            if (!map.has(key)) {
                map.set(key, {
                    contract: getContractInfo(key),
                    items: []
                });
            }
            map.get(key)!.items.push(mission);
        });

        return Array.from(map.values());
    }, [missions, contracts]);

    const formatCurrency = (amount: number, currencyId: number | null) => {
        const currency = loaiTien.find(t => t.id === currencyId);
        return new Intl.NumberFormat('vi-VN').format(amount) + " " + (currency?.ten || "");
    };

    const handleExportAll = () => {
        const exportData = missions.map((m) => {
            const contract = getContractInfo(m.hopDongId);
            const mType = getMissionType(m.loaiDoanId);
            return {
                "Số hợp đồng": contract?.soHdNgoai || contract?.soHdNoi || "N/A",
                "Tên hợp đồng": contract?.ten || "N/A",
                "Phân loại": mType?.phanLoai || "N/A",
                "Loại đoàn": mType?.tenLoai || "N/A",
                "Tên đoàn": m.tenDoan,
                "Chi phí": m.chiPhi,
                "Loại tiền": getCurrencyName(m.loaiTienId),
                "Tỷ giá": m.tyGia,
                "Ghi chú": m.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DoanRaVao");
        const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(new Blob([buf]), "tat_ca_doan_ra_vao.xlsx");
    };

    const handleExportContract = (groupMissions: DoanRaVao[], contract?: HopDong) => {
        const exportData = groupMissions.map((m) => {
            const mType = getMissionType(m.loaiDoanId);
            return {
                "Số hợp đồng": contract?.soHdNgoai || contract?.soHdNoi || "N/A",
                "Tên hợp đồng": contract?.ten || "N/A",
                "Phân loại": mType?.phanLoai || "N/A",
                "Loại đoàn": mType?.tenLoai || "N/A",
                "Tên đoàn": m.tenDoan,
                "Chi phí": m.chiPhi,
                "Loại tiền": getCurrencyName(m.loaiTienId),
                "Tỷ giá": m.tyGia,
                "Ghi chú": m.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DoanRaVao");
        const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(new Blob([buf]), `doan_ra_vao_${contract?.soHdNgoai || 'hop_dong'}.xlsx`);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Đoàn ra/vào"
                    subtitle="Tra cứu và quản lý các đoàn ra, đoàn vào theo hợp đồng"
                    onCreateContract={() => { }}
                />

                <main className="flex-1 overflow-auto p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Tìm theo số hợp đồng hoặc tên đoàn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-sky-600 hover:bg-sky-700">
                                <Plus className="w-4 h-4 mr-2" /> Thêm đoàn
                            </Button>
                            <Button variant="outline" onClick={handleExportAll}>
                                <Download className="w-4 h-4 mr-2" /> Xuất tất cả
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-slate-600 hover:text-sky-600"
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
                    ) : groupedMissions.length === 0 ? (
                        <Card className="p-12 text-center text-slate-500 border-dashed">
                            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p>Không tìm thấy thông tin đoàn ra/vào nào</p>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {groupedMissions.map((group, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {group.contract ? `${group.contract.soHdNgoai || group.contract.soHdNoi} - ${group.contract.ten}` : "Hợp đồng không xác định"}
                                                </h3>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {group.items.length} ĐOÀN LIÊN KẾT
                                                </p>
                                            </div>
                                        </div>
                                        {group.contract && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-sky-600 hover:bg-sky-50"
                                                onClick={() => handleExportContract(group.items, group.contract)}
                                            >
                                                <Download className="w-4 h-4 mr-1" /> Xuất Excel
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {group.items.map((mission) => {
                                            const mType = getMissionType(mission.loaiDoanId);
                                            const isOutbound = mType?.phanLoai === "đoàn ra";
                                            return (
                                                <Card key={mission.id} className="overflow-hidden border-slate-200 hover:border-sky-300 transition-all shadow-sm hover:shadow-md bg-white">
                                                    <CardHeader className="p-4 border-b bg-slate-50/30">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Badge className={isOutbound ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-sky-100 text-sky-700 hover:bg-sky-100"}>
                                                                {isOutbound ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownLeft className="w-3 h-3 mr-1" />}
                                                                {mType?.tenLoai || "N/A"}
                                                            </Badge>
                                                            <div className="flex items-center gap-0.5">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-400 hover:text-sky-600"
                                                                    onClick={() => {
                                                                        setSelectedMission(mission);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                                    onClick={() => {
                                                                        if (confirm("Xóa đoàn này?")) deleteMutation.mutate(mission.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <CardTitle className="text-base font-bold text-slate-800 mt-2 truncate">
                                                            {mission.tenDoan}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-4">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <div className="flex items-center gap-2 text-slate-500">
                                                                    <DollarSign className="w-4 h-4" />
                                                                    <span>Chi phí:</span>
                                                                </div>
                                                                <span className="font-semibold text-slate-900 font-mono">
                                                                    {formatCurrency(mission.chiPhi || 0, mission.loaiTienId)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-2">
                                                                <span>Tỷ giá: {mission.tyGia || 1}</span>
                                                            </div>
                                                            {mission.ghiChu && (
                                                                <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded">
                                                                    {mission.ghiChu}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <MissionModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />

                <MissionTypeManagerModal
                    isOpen={isTypeManagerOpen}
                    onClose={() => setIsTypeManagerOpen(false)}
                />

                {selectedMission && (
                    <MissionModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedMission(null);
                        }}
                        mission={selectedMission}
                    />
                )}
            </div>
        </div>
    );
}
