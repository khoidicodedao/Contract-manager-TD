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
    Stamp,
    Eye,
    FileText,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { ThuTinDung, HopDong } from "@shared/schema";
import LetterOfCreditModal from "@/components/modals/letter-of-credit-modal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function LetterOfCreditPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<ThuTinDung | null>(null);
    const [selectedHds, setSelectedHds] = useState<number[]>([]);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Queries
    const { data: lcList = [], isLoading } = useQuery<ThuTinDung[]>({
        queryKey: ["/api/thu-tin-dung"],
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/thu-tin-dung/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/thu-tin-dung"] });
            toast({ description: "Đã xóa thư tín dụng thành công" });
        },
    });

    const handleOpenModal = (mode: "create" | "edit" | "view", record?: ThuTinDung) => {
        setModalMode(mode);
        setSelectedRecord(record || null);
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setSelectedRecord(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thư tín dụng này?")) {
            deleteMutation.mutate(id);
        }
    };

    const filteredRecords = useMemo(() => {
        let result = lcList;
        if (searchTerm) {
            result = result.filter((item) => {
                const contract = contracts.find((c) => c.id === item.hopDongId);
                return (
                    item.soLc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contract?.soHdNgoai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contract?.ten?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }
        return result;
    }, [lcList, searchTerm, contracts]);

    const formatDate = (date: string | null) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-";

    const handleExport = () => {
        const dataToExport = selectedHds.length > 0
            ? lcList.filter(l => selectedHds.includes(l.hopDongId))
            : lcList;

        const rows = dataToExport.map(l => {
            const contract = contracts.find(c => c.id === l.hopDongId);
            return {
                "Hợp đồng": contract ? `${contract.soHdNgoai} - ${contract.ten}` : "-",
                "Số LC": l.soLc,
                "Ngày mở": formatDate(l.ngayMo),
                "Trị giá": l.triGia,
                "Tỷ giá": l.tyGia,
                "Thời hạn": formatDate(l.thoiHan),
                "Người thụ hưởng": l.nguoiThuHuong,
                "Ghi chú": l.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LetterOfCredit");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "danh_sach_thu_tin_dung.xlsx");
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Thư tín dụng (L/C)"
                    subtitle="Quản lý việc mở thư tín dụng cho các hợp đồng ngoại..."
                />
                <main className="flex-1 overflow-auto p-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Danh sách Thư tín dụng</CardTitle>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" onClick={handleExport}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Xuất Excel
                                </Button>
                                <Button onClick={() => handleOpenModal("create")}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Mở L/C
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm theo số L/C, hợp đồng..."
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
                                            <TableHead>Số L/C</TableHead>
                                            <TableHead>Hợp đồng</TableHead>
                                            <TableHead>Ngày mở</TableHead>
                                            <TableHead>Trị giá</TableHead>
                                            <TableHead>Thời hạn</TableHead>
                                            <TableHead>Người thụ hưởng</TableHead>
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
                                                    Chưa có dữ liệu thư tín dụng
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((item) => {
                                                const contract = contracts.find(c => c.id === item.hopDongId);
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
                                                                {item.soLc}
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
                                                        <TableCell>{formatDate(item.ngayMo)}</TableCell>
                                                        <TableCell>
                                                            {item.triGia?.toLocaleString()} {item.tyGia !== 1 ? `(x${item.tyGia})` : ""}
                                                        </TableCell>
                                                        <TableCell>{formatDate(item.thoiHan)}</TableCell>
                                                        <TableCell>{item.nguoiThuHuong}</TableCell>
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
                <LetterOfCreditModal
                    isOpen={!!modalMode}
                    onClose={handleCloseModal}
                    mode={modalMode}
                    record={selectedRecord}
                />
            )}
        </div>
    );
}
