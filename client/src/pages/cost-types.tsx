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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoaiChiPhi } from "@shared/schema";
import CostTypeModal from "@/components/modals/cost-type-modal";

export default function CostTypesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<LoaiChiPhi | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: costTypes = [], isLoading } = useQuery<LoaiChiPhi[]>({
        queryKey: ["/api/loai-chi-phi"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-chi-phi/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-chi-phi"] });
            toast({ description: "Đã xóa loại chi phí thành công" });
        },
    });

    const handleOpenModal = (mode: "create" | "edit", record?: LoaiChiPhi) => {
        setModalMode(mode);
        setSelectedRecord(record || null);
    };

    const handleCloseModal = () => {
        setModalMode(null);
        setSelectedRecord(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa loại chi phí này?")) {
            deleteMutation.mutate(id);
        }
    };

    const filteredRecords = useMemo(() => {
        return costTypes.filter((item) =>
            item.tenLoai.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.maLoai?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [costTypes, searchTerm]);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Loại chi phí"
                    subtitle="Quản lý danh mục các loại chi phí thực tế và theo hợp đồng"
                />
                <main className="flex-1 overflow-auto p-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle>Danh sách Loại chi phí</CardTitle>
                            <Button onClick={() => handleOpenModal("create")}>
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm loại chi phí
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm theo mã, tên loại..."
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
                                            <TableHead className="w-[150px]">Mã loại</TableHead>
                                            <TableHead>Tên loại chi phí</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right w-[120px]">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10">
                                                    Đang tải dữ liệu...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredRecords.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10">
                                                    Chưa có dữ liệu loại chi phí
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredRecords.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium text-blue-600">{item.maLoai || "-"}</TableCell>
                                                    <TableCell className="font-medium">{item.tenLoai}</TableCell>
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
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            {modalMode && (
                <CostTypeModal
                    isOpen={!!modalMode}
                    onClose={handleCloseModal}
                    mode={modalMode}
                    record={selectedRecord}
                />
            )}
        </div>
    );
}
