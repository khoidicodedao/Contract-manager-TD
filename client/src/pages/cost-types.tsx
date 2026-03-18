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
    Tag,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoaiChiPhi } from "@shared/schema";
import CostTypeModal from "@/components/modals/cost-type-modal";

export default function CostTypesPage() {
    const [ctSearchTerm, setCtSearchTerm] = useState("");
    const [ctModalMode, setCtModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedCostType, setSelectedCostType] = useState<LoaiChiPhi | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: costTypes = [], isLoading: ctLoading } = useQuery<LoaiChiPhi[]>({
        queryKey: ["/api/loai-chi-phi"],
    });

    const deleteCostTypeMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-chi-phi/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-chi-phi"] });
            toast({ description: "Đã xóa loại chi phí thành công" });
        },
    });

    const handleOpenCtModal = (mode: "create" | "edit", record?: LoaiChiPhi) => {
        setCtModalMode(mode);
        setSelectedCostType(record || null);
    };
    const handleCloseCtModal = () => {
        setCtModalMode(null);
        setSelectedCostType(null);
    };
    const handleDeleteCostType = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa loại chi phí này?")) {
            deleteCostTypeMutation.mutate(id);
        }
    };

    const filteredCostTypes = useMemo(() => {
        return costTypes.filter((item) =>
            item.tenLoai.toLowerCase().includes(ctSearchTerm.toLowerCase()) ||
            item.maLoai?.toLowerCase().includes(ctSearchTerm.toLowerCase())
        );
    }, [costTypes, ctSearchTerm]);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Loại chi phí"
                    subtitle="Quản lý danh mục loại chi phí sử dụng trong hệ thống"
                />
                <main className="flex-1 overflow-auto p-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-primary" />
                                Danh sách Loại chi phí
                            </CardTitle>
                            <Button onClick={() => handleOpenCtModal("create")}>
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
                                        value={ctSearchTerm}
                                        onChange={(e) => setCtSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-md border shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[150px] font-bold">Mã loại</TableHead>
                                            <TableHead className="font-bold">Tên loại chi phí</TableHead>
                                            <TableHead className="font-bold">Ghi chú</TableHead>
                                            <TableHead className="text-right w-[120px] font-bold">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ctLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10">
                                                    Đang tải dữ liệu...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredCostTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-slate-400">
                                                    Chưa có dữ liệu loại chi phí
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCostTypes.map((item) => (
                                                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="font-medium text-blue-600">{item.maLoai || "-"}</TableCell>
                                                    <TableCell className="font-medium text-slate-900">{item.tenLoai}</TableCell>
                                                    <TableCell className="text-slate-500">{item.ghiChu || "-"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="hover:bg-blue-50 hover:text-blue-600"
                                                                onClick={() => handleOpenCtModal("edit", item)}
                                                            >
                                                                <Edit className="w-4 h-4 text-blue-500" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="hover:bg-red-50 hover:text-red-600"
                                                                onClick={() => handleDeleteCostType(item.id)}
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

            {/* Modal Loại chi phí */}
            {ctModalMode && (
                <CostTypeModal
                    isOpen={!!ctModalMode}
                    onClose={handleCloseCtModal}
                    mode={ctModalMode}
                    record={selectedCostType}
                />
            )}
        </div>
    );
}
