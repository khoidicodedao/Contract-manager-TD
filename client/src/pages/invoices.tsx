"use client";

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
    FileText,
    Search,
    Plus,
    Download,
    Edit,
    Trash2,
    Calendar,
    CreditCard,
    Building2,
    Settings,
} from "lucide-react";
import { HoaDon, LoaiHoaDon, HopDong, LoaiTien } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InvoiceModal from "@/components/modals/invoice-modal";
import InvoiceTypeManagerModal from "@/components/modals/invoice-type-manager-modal";

export default function Invoices() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<HoaDon | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery<HoaDon[]>({
        queryKey: ["/api/hoa-don", searchTerm],
        queryFn: async ({ queryKey }) => {
            const [_key, search] = queryKey;
            const url = search ? `/api/hoa-don?search=${search}` : "/api/hoa-don";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: loaiHoaDon = [] } = useQuery<LoaiHoaDon[]>({
        queryKey: ["/api/loai-hoa-don"],
    });

    const { data: loaiTien = [] } = useQuery<LoaiTien[]>({
        queryKey: ["/api/loai-tien"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiRequest("DELETE", `/api/hoa-don/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hoa-don"] });
            toast({ title: "Thành công", description: "Hóa đơn đã được xóa" });
        },
    });

    const getContractInfo = (id: number | null) => {
        return contracts.find((c) => c.id === id);
    };

    const getLoaiHoaDonName = (id: number) => {
        return loaiHoaDon.find((l) => l.id === id)?.ten || "N/A";
    };

    const getLoaiTienName = (id: number | null) => {
        return loaiTien.find((t) => t.id === id)?.ten || "N/A";
    };

    // Group invoices by contract for display
    const groupedInvoices = useMemo(() => {
        const map = new Map<number | string, { contract?: HopDong; items: HoaDon[] }>();

        invoices.forEach((inv) => {
            const key = inv.hopDongId || "unlinked";
            if (!map.has(key)) {
                map.set(key, {
                    contract: inv.hopDongId ? getContractInfo(inv.hopDongId) : undefined,
                    items: []
                });
            }
            map.get(key)!.items.push(inv);
        });

        return Array.from(map.values());
    }, [invoices, contracts]);

    const handleExportAll = () => {
        const exportData = invoices.map((inv) => {
            const contract = getContractInfo(inv.hopDongId);
            return {
                "Số hợp đồng": contract?.soHdNgoai || contract?.soHdNoi || "N/A",
                "Tên hợp đồng": contract?.ten || "N/A",
                "Tên hóa đơn": inv.tenHoaDon,
                "Loại hóa đơn": getLoaiHoaDonName(inv.loaiHoaDonId),
                "Ngày hóa đơn": inv.ngayHoaDon,
                "Trị giá": inv.triGia,
                "Loại tiền": getLoaiTienName(inv.loaiTienId),
                "Tỷ giá": inv.tyGia,
                "Ghi chú": inv.ghiChu,
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "HoaDon");
        const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(new Blob([buf]), "tat_ca_hoa_don.xlsx");
    };

    const handleExportContract = (groupInvoices: HoaDon[], contract?: HopDong) => {
        const exportData = groupInvoices.map((inv) => ({
            "Số hợp đồng": contract?.soHdNgoai || contract?.soHdNgoai || "N/A",
            "Tên hợp đồng": contract?.ten || "N/A",
            "Tên hóa đơn": inv.tenHoaDon,
            "Loại hóa đơn": getLoaiHoaDonName(inv.loaiHoaDonId),
            "Ngày hóa đơn": inv.ngayHoaDon,
            "Trị giá": inv.triGia,
            "Loại tiền": getLoaiTienName(inv.loaiTienId),
            "Tỷ giá": inv.tyGia,
            "Ghi chú": inv.ghiChu,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "HoaDon");
        const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        saveAs(new Blob([buf]), `hoa_don_${contract?.soHdNgoai || 'hop_dong'}.xlsx`);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Hóa đơn"
                    subtitle="Quản lý và tra cứu thông tin hóa đơn theo hợp đồng"
                    icon={FileText}
                    onCreateContract={() => { }}
                />

                <main className="flex-1 overflow-auto p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Tìm theo số hợp đồng hoặc tên hóa đơn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="w-4 h-4 mr-2" /> Thêm hóa đơn
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
                    ) : groupedInvoices.length === 0 ? (
                        <Card className="p-12 text-center">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Không tìm thấy hóa đơn nào</p>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {groupedInvoices.map((group, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {group.contract ? `${group.contract.soHdNgoai || group.contract.soHdNoi} - ${group.contract.ten}` : "Chưa liên kết hợp đồng"}
                                                </h3>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {group.items.length} HÓA ĐƠN
                                                </p>
                                            </div>
                                        </div>
                                        {group.contract && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-indigo-600"
                                                onClick={() => handleExportContract(group.items, group.contract)}
                                            >
                                                <Download className="w-4 h-4 mr-2" /> Xuất Excel
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {group.items.map((inv) => (
                                            <Card key={inv.id} className="overflow-hidden border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                                                <CardHeader className="p-4 bg-slate-50/50 border-b">
                                                    <div className="flex items-center justify-between">
                                                        <Badge className="bg-white text-indigo-700 border-indigo-200 uppercase text-[10px] px-2 py-0.5">
                                                            {getLoaiHoaDonName(inv.loaiHoaDonId)}
                                                        </Badge>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500"
                                                                onClick={() => {
                                                                    setSelectedInvoice(inv);
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
                                                                    if (confirm("Xóa hóa đơn này?")) deleteMutation.mutate(inv.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <CardTitle className="text-base font-bold text-slate-800 mt-2">
                                                        {inv.tenHoaDon}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 bg-white">
                                                    <div className="grid grid-cols-2 gap-y-3">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">Ngày:</span>
                                                            <span className="font-medium">{inv.ngayHoaDon || "N/A"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CreditCard className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-600">Trị giá:</span>
                                                            <span className="font-bold text-indigo-600">
                                                                {inv.triGia?.toLocaleString("vi-VN")} {getLoaiTienName(inv.loaiTienId)}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-2 text-sm border-t pt-2 mt-1">
                                                            <p className="text-slate-500 italic">
                                                                {inv.ghiChu || "Không có ghi chú"}
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

                <InvoiceModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />

                <InvoiceTypeManagerModal
                    isOpen={isTypeManagerOpen}
                    onClose={() => setIsTypeManagerOpen(false)}
                />

                {selectedInvoice && (
                    <InvoiceModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedInvoice(null);
                        }}
                        invoice={selectedInvoice}
                    />
                )}
            </div>
        </div>
    );
}
