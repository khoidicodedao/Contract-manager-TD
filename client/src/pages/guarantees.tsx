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
    Shield,
    Eye,
    FileText,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { BaoLanh, HopDong, LoaiBaoLanh } from "@shared/schema";
import GuaranteeModal from "@/components/modals/guarantee-modal";
import GuaranteeTypeModal from "@/components/modals/guarantee-type-modal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function GuaranteesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<BaoLanh | null>(null);
    const [selectedHds, setSelectedHds] = useState<number[]>([]);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Queries
    const { data: guarantees = [], isLoading } = useQuery<BaoLanh[]>({
        queryKey: ["/api/bao-lanh"],
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: loaiBaoLanh = [] } = useQuery<LoaiBaoLanh[]>({
        queryKey: ["/api/loai-bao-lanh"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/bao-lanh/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bao-lanh"] });
            toast({ description: "Đã xóa bảo lãnh thành công" });
        },
    });

    const handleOpenModal = (mode: "create" | "edit" | "view", record?: BaoLanh) => {
        setModalMode(mode);
        setSelectedRecord(record || null);
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setSelectedRecord(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bảo lãnh này?")) {
            deleteMutation.mutate(id);
        }
    };

    const filteredRecords = useMemo(() => {
        let result = guarantees;
        if (searchTerm) {
            result = result.filter((item) => {
                const contract = contracts.find((c) => c.id === item.hopDongId);
                return (
                    item.soBaoLanh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contract?.soHdNgoai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contract?.ten?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }
        return result;
    }, [guarantees, searchTerm, contracts]);

    const formatDate = (date: string | null) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-";

    const handleExport = () => {
        const dataToExport = selectedHds.length > 0
            ? guarantees.filter(g => selectedHds.includes(g.hopDongId))
            : guarantees;

        const rows = dataToExport.map(g => {
            const contract = contracts.find(c => c.id === g.hopDongId);
            const type = loaiBaoLanh.find(l => l.id === g.loaiBaoLanhId);
            return {
                "Hợp đồng": contract ? `${contract.soHdNgoai} - ${contract.ten}` : "-",
                "Số bảo lãnh": g.soBaoLanh,
                "Loại bảo lãnh": type?.tenLoai || "-",
                "Trị giá": g.triGia,
                "Tỷ giá": g.tyGia,
                "Tỷ lệ (%)": g.tyLe,
                "Người thụ hưởng": g.nguoiThuHuong,
                "Ngày cấp": formatDate(g.ngayCap),
                "Thời hạn": formatDate(g.thoiHan),
                "Ghi chú": g.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BaoLanh");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "danh_sach_bao_lanh.xlsx");
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Bảo lãnh"
                    subtitle="Quản lý các loại bảo lãnh thực hiện hợp đồng, bảo lãnh tạm ứng..."
                />
                <main className="flex-1 overflow-auto p-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Danh sách Bảo lãnh</CardTitle>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Xuất Excel
                                </Button>
                                <Button variant="outline" onClick={() => setIsTypeModalOpen(true)}>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Quản lý loại
                                </Button>
                                <Button onClick={() => handleOpenModal("create")}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm Bảo lãnh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm theo số bảo lãnh, hợp đồng..."
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
                                            <TableHead>Số bảo lãnh</TableHead>
                                            <TableHead>Hợp đồng</TableHead>
                                            <TableHead>Loại</TableHead>
                                            <TableHead>Trị giá</TableHead>
                                            <TableHead>Ngày cấp</TableHead>
                                            <TableHead>Thời hạn</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10">
                                                    Đang tải dữ liệu...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10">
                                                    Chưa có dữ liệu bảo lãnh
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((item) => {
                                                const contract = contracts.find(c => c.id === item.hopDongId);
                                                const type = loaiBaoLanh.find(l => l.id === item.loaiBaoLanhId);
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
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center space-x-2">
                                                                {item.soBaoLanh}
                                                                {item.fileScan && (
                                                                    <FileText
                                                                        className="w-4 h-4 text-blue-500 cursor-pointer"
                                                                        onClick={(e: React.MouseEvent) => {
                                                                            e.stopPropagation();
                                                                            window.open(item.fileScan!, "_blank");
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">
                                                                <p className="font-semibold">{contract?.soHdNgoai || contract?.soHdNoi}</p>
                                                                <p className="text-slate-500 truncate max-w-[200px]">{contract?.ten}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{type?.tenLoai || "-"}</TableCell>
                                                        <TableCell>
                                                            {item.triGia?.toLocaleString()} {item.tyGia !== 1 ? `(x${item.tyGia})` : ""}
                                                        </TableCell>
                                                        <TableCell>{formatDate(item.ngayCap)}</TableCell>
                                                        <TableCell>{formatDate(item.thoiHan)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end space-x-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleOpenModal("view", item)}
                                                                >
                                                                    <Eye className="w-4 h-4 text-slate-500" />
                                                                </Button>
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
                <GuaranteeModal
                    isOpen={!!modalMode}
                    onClose={handleCloseModal}
                    mode={modalMode}
                    record={selectedRecord}
                />
            )}

            <GuaranteeTypeModal
                isOpen={isTypeModalOpen}
                onClose={() => setIsTypeModalOpen(false)}
            />
        </div>
    );
}
