"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    FileSpreadsheet,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChiPhiTheoHopDong, HopDong, LoaiChiPhi } from "@shared/schema";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PlannedCostModal from "@/components/modals/planned-cost-modal";

export default function PlannedCostsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<ChiPhiTheoHopDong | null>(null);
    const [selectedHds, setSelectedHds] = useState<number[]>([]);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: costs = [], isLoading } = useQuery<ChiPhiTheoHopDong[]>({
        queryKey: ["/api/chi-phi-theo-hop-dong"],
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: costTypes = [] } = useQuery<LoaiChiPhi[]>({
        queryKey: ["/api/loai-chi-phi"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/chi-phi-theo-hop-dong/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/chi-phi-theo-hop-dong"] });
            toast({ description: "Đã xóa chi phí theo hợp đồng thành công" });
        },
    });

    const handleOpenModal = (mode: "create" | "edit", record?: ChiPhiTheoHopDong) => {
        setModalMode(mode);
        setSelectedRecord(record || null);
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setSelectedRecord(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa chi phí theo hợp đồng này?")) {
            deleteMutation.mutate(id);
        }
    };

    const filteredRecords = useMemo(() => {
        return costs.filter((item) => {
            const contract = contracts.find((c) => c.id === item.hopDongId);
            const costType = costTypes.find((t) => t.id === item.loaiChiPhiId);
            const searchLower = searchTerm.toLowerCase();
            return (
                contract?.ten.toLowerCase().includes(searchLower) ||
                contract?.soHdNgoai?.toLowerCase().includes(searchLower) ||
                costType?.tenLoai.toLowerCase().includes(searchLower) ||
                item.ghiChu?.toLowerCase().includes(searchLower)
            );
        });
    }, [costs, searchTerm, contracts, costTypes]);

    const formatDate = (date: string | null) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-";

    const handleExport = () => {
        const dataToExport = selectedHds.length > 0
            ? costs.filter(c => selectedHds.includes(c.hopDongId))
            : costs;

        const rows = dataToExport.map(c => {
            const contract = contracts.find(h => h.id === c.hopDongId);
            const costType = costTypes.find(t => t.id === c.loaiChiPhiId);
            return {
                "Hợp đồng": contract ? `${contract.soHdNgoai} - ${contract.ten}` : "-",
                "Loại chi phí": costType?.tenLoai || "-",
                "Ngày thực hiện": formatDate(c.ngayThucHien),
                "Trị giá": c.triGia,
                "Ghi chú": c.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ChiPhiTheoHopDong");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "danh_sach_chi_phi_theo_hop_dong.xlsx");
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Chi phí theo Hợp đồng"
                    subtitle="Lập kế hoạch và quản lý các loại chi phí dự kiến theo hợp đồng"
                />
                <main className="flex-1 overflow-auto p-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>Danh sách Chi phí theo Hợp đồng</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Xuất Excel
                                </Button>
                                <Button onClick={() => handleOpenModal("create")}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm chi phí
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm theo hợp đồng, loại chi phí..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedHds(contracts.map(c => c.id));
                                                        } else {
                                                            setSelectedHds([]);
                                                        }
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead>Hợp đồng</TableHead>
                                            <TableHead>Loại chi phí</TableHead>
                                            <TableHead>Ngày thực hiện</TableHead>
                                            <TableHead>Trị giá</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-10">
                                                    Đang tải dữ liệu...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-10">
                                                    Chưa có dữ liệu chi phí theo hợp đồng
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((item) => {
                                                const contract = contracts.find(c => c.id === item.hopDongId);
                                                const costType = costTypes.find(t => t.id === item.loaiChiPhiId);
                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedHds.includes(item.hopDongId)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedHds([...selectedHds, item.hopDongId]);
                                                                    } else {
                                                                        setSelectedHds(selectedHds.filter(id => id !== item.hopDongId));
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                <p className="font-semibold">{contract?.soHdNgoai || contract?.soHdNoi}</p>
                                                                <p className="text-slate-500 truncate max-w-[200px]">{contract?.ten}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-green-600">{costType?.tenLoai || "-"}</TableCell>
                                                        <TableCell>{formatDate(item.ngayThucHien)}</TableCell>
                                                        <TableCell className="font-semibold text-primary">
                                                            {item.triGia?.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-slate-500">{item.ghiChu || "-"}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end space-x-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleOpenModal("edit", item)}
                                                                >
                                                                    <Edit className="w-4 h-4 text-blue-500" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            {modalMode && (
                <PlannedCostModal
                    isOpen={!!modalMode}
                    onClose={handleCloseModal}
                    mode={modalMode}
                    record={selectedRecord}
                />
            )}
        </div>
    );
}
