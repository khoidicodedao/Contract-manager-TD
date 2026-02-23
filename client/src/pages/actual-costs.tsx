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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    FileSpreadsheet,
    Tag,
    DollarSign,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChiPhiThucTe, HopDong, LoaiChiPhi } from "@shared/schema";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ActualCostModal from "@/components/modals/actual-cost-modal";
import CostTypeModal from "@/components/modals/cost-type-modal";

export default function ActualCostsPage() {
    // --- Chi phí thực tế state ---
    const [searchTerm, setSearchTerm] = useState("");
    const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<ChiPhiThucTe | null>(null);
    const [selectedHds, setSelectedHds] = useState<number[]>([]);

    // --- Loại chi phí state ---
    const [ctSearchTerm, setCtSearchTerm] = useState("");
    const [ctModalMode, setCtModalMode] = useState<"create" | "edit" | null>(null);
    const [selectedCostType, setSelectedCostType] = useState<LoaiChiPhi | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // --- Queries ---
    const { data: costs = [], isLoading } = useQuery<ChiPhiThucTe[]>({
        queryKey: ["/api/chi-phi-thuc-te"],
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: costTypes = [], isLoading: ctLoading } = useQuery<LoaiChiPhi[]>({
        queryKey: ["/api/loai-chi-phi"],
    });

    // --- Mutations: Chi phí thực tế ---
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/chi-phi-thuc-te/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/chi-phi-thuc-te"] });
            toast({ description: "Đã xóa chi phí thực tế thành công" });
        },
    });

    // --- Mutations: Loại chi phí ---
    const deleteCostTypeMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-chi-phi/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-chi-phi"] });
            toast({ description: "Đã xóa loại chi phí thành công" });
        },
    });

    // --- Handlers: Chi phí thực tế ---
    const handleOpenModal = (mode: "create" | "edit", record?: ChiPhiThucTe) => {
        setModalMode(mode);
        setSelectedRecord(record || null);
    };
    const handleCloseModal = () => {
        setModalMode(null);
        setSelectedRecord(null);
    };
    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa chi phí thực tế này?")) {
            deleteMutation.mutate(id);
        }
    };

    // --- Handlers: Loại chi phí ---
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

    // --- Derived data ---
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

    const filteredCostTypes = useMemo(() => {
        return costTypes.filter((item) =>
            item.tenLoai.toLowerCase().includes(ctSearchTerm.toLowerCase()) ||
            item.maLoai?.toLowerCase().includes(ctSearchTerm.toLowerCase())
        );
    }, [costTypes, ctSearchTerm]);

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
        XLSX.utils.book_append_sheet(wb, ws, "ChiPhiThucTe");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "danh_sach_chi_phi_thuc_te.xlsx");
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Quản lý Chi phí"
                    subtitle="Quản lý chi phí thực tế và danh mục loại chi phí theo hợp đồng"
                />
                <main className="flex-1 overflow-auto p-6">
                    <Tabs defaultValue="actual-costs" className="w-full">
                        {/* Tab Nav */}
                        <TabsList className="mb-6 bg-slate-100 p-1 h-auto">
                            <TabsTrigger
                                value="actual-costs"
                                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <DollarSign className="w-4 h-4" />
                                Chi phí thực tế
                                {costs.length > 0 && (
                                    <span className="ml-1 text-xs bg-primary text-white rounded-full px-2 py-0.5">
                                        {costs.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="cost-types"
                                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                <Tag className="w-4 h-4" />
                                Loại chi phí
                                {costTypes.length > 0 && (
                                    <span className="ml-1 text-xs bg-slate-500 text-white rounded-full px-2 py-0.5">
                                        {costTypes.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* ===== TAB 1: Chi phí thực tế ===== */}
                        <TabsContent value="actual-costs">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle>Danh sách Chi phí thực tế</CardTitle>
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
                                                        <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                                                            Chưa có dữ liệu chi phí thực tế
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
                                                                <TableCell className="font-medium text-blue-600">{costType?.tenLoai || "-"}</TableCell>
                                                                <TableCell>{formatDate(item.ngayThucHien)}</TableCell>
                                                                <TableCell className="font-semibold text-red-600">
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
                        </TabsContent>

                        {/* ===== TAB 2: Loại chi phí ===== */}
                        <TabsContent value="cost-types">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle>Danh sách Loại chi phí</CardTitle>
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
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium text-blue-600">{item.maLoai || "-"}</TableCell>
                                                            <TableCell className="font-medium">{item.tenLoai}</TableCell>
                                                            <TableCell className="text-slate-500">{item.ghiChu || "-"}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end space-x-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleOpenCtModal("edit", item)}
                                                                    >
                                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
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
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Modal Chi phí thực tế */}
            {modalMode && (
                <ActualCostModal
                    isOpen={!!modalMode}
                    onClose={handleCloseModal}
                    mode={modalMode}
                    record={selectedRecord}
                />
            )}

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
