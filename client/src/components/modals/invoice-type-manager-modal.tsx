import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoaiHoaDon } from "@shared/schema";

interface InvoiceTypeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InvoiceTypeManagerModal({
    isOpen,
    onClose,
}: InvoiceTypeManagerModalProps) {
    const [editingType, setEditingType] = useState<LoaiHoaDon | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: invoiceTypes = [], isLoading } = useQuery<LoaiHoaDon[]>({
        queryKey: ["/api/loai-hoa-don"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: Omit<LoaiHoaDon, "id">) => {
            await apiRequest("POST", "/api/loai-hoa-don", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-hoa-don"] });
            setIsFormOpen(false);
            setEditingType(null);
            toast({ description: "Đã tạo loại hóa đơn mới" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: LoaiHoaDon) => {
            await apiRequest("PUT", `/api/loai-hoa-don/${data.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-hoa-don"] });
            setIsFormOpen(false);
            setEditingType(null);
            toast({ description: "Đã cập nhật loại hóa đơn" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-hoa-don/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-hoa-don"] });
            toast({ description: "Đã xóa loại hóa đơn" });
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = {
            ten: formData.get("ten") as string,
            ghiChu: formData.get("ghiChu") as string,
        };

        if (editingType) {
            updateMutation.mutate({ ...data, id: editingType.id });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-indigo-600" /> Quản lý Loại hóa đơn
                    </DialogTitle>
                    <DialogDescription>
                        Thêm hoặc chỉnh sửa các danh mục hóa đơn sử dụng trong hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {!isFormOpen ? (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => {
                                        setEditingType(null);
                                        setIsFormOpen(true);
                                    }}
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Thêm loại mới
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[80px]">Mã</TableHead>
                                            <TableHead>Tên loại</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4">Đang tải...</TableCell>
                                            </TableRow>
                                        ) : invoiceTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-slate-400">Chưa có dữ liệu</TableCell>
                                            </TableRow>
                                        ) : (
                                            invoiceTypes.map((type) => (
                                                <TableRow key={type.id}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-[10px]">#{type.id}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{type.ten}</TableCell>
                                                    <TableCell className="text-sm text-slate-500 truncate max-w-[200px]">{type.ghiChu || "-"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => {
                                                                    setEditingType(type);
                                                                    setIsFormOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-500"
                                                                onClick={() => {
                                                                    if (confirm("Xóa loại hóa đơn này?")) {
                                                                        deleteMutation.mutate(type.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <h4 className="font-semibold text-sm border-b pb-2 mb-4">
                                {editingType ? "Chỉnh sửa loại hóa đơn" : "Thêm loại hóa đơn mới"}
                            </h4>
                            <div className="space-y-2">
                                <Label htmlFor="ten">Tên loại hóa đơn</Label>
                                <Input
                                    id="ten"
                                    name="ten"
                                    defaultValue={editingType?.ten}
                                    placeholder="Ví dụ: Hóa đơn GTGT..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ghiChu">Ghi chú</Label>
                                <Textarea
                                    id="ghiChu"
                                    name="ghiChu"
                                    defaultValue={editingType?.ghiChu || ""}
                                    placeholder="Mô tả thêm..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        setEditingType(null);
                                    }}
                                >
                                    Quay lại
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {editingType ? "Cập nhật" : "Lưu lại"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
