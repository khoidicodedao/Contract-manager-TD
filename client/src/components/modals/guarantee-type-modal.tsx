import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoaiBaoLanh } from "@shared/schema";

interface GuaranteeTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuaranteeTypeModal({ isOpen, onClose }: GuaranteeTypeModalProps) {
    const [editingType, setEditingType] = useState<LoaiBaoLanh | null>(null);
    const [tenLoai, setTenLoai] = useState("");
    const [ghiChu, setGhiChu] = useState("");
    
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: types = [], isLoading } = useQuery<LoaiBaoLanh[]>({
        queryKey: ["/api/loai-bao-lanh"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: { tenLoai: string; ghiChu?: string }) => {
            await apiRequest("POST", "/api/loai-bao-lanh", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-bao-lanh"] });
            setTenLoai("");
            setGhiChu("");
            toast({ description: "Đã thêm loại bảo lãnh thành công" });
        },
        onError: () => {
            toast({ variant: "destructive", description: "Lỗi khi thêm loại bảo lãnh" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: LoaiBaoLanh) => {
            await apiRequest("PUT", `/api/loai-bao-lanh/${data.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-bao-lanh"] });
            setEditingType(null);
            setTenLoai("");
            setGhiChu("");
            toast({ description: "Đã cập nhật loại bảo lãnh thành công" });
        },
        onError: () => {
            toast({ variant: "destructive", description: "Lỗi khi cập nhật loại bảo lãnh" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-bao-lanh/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-bao-lanh"] });
            toast({ description: "Đã xóa loại bảo lãnh thành công" });
        },
        onError: () => {
            toast({ variant: "destructive", description: "Lỗi khi xóa loại bảo lãnh" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenLoai.trim()) return;

        if (editingType) {
            updateMutation.mutate({ ...editingType, tenLoai, ghiChu });
        } else {
            createMutation.mutate({ tenLoai, ghiChu });
        }
    };

    const handleEdit = (type: LoaiBaoLanh) => {
        setEditingType(type);
        setTenLoai(type.tenLoai);
        setGhiChu(type.ghiChu || "");
    };

    const handleCancel = () => {
        setEditingType(null);
        setTenLoai("");
        setGhiChu("");
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa loại bảo lãnh này?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Quản lý Loại Bảo Lãnh</DialogTitle>
                    <DialogDescription>
                        Thêm, sửa hoặc xóa các loại bảo lãnh trong hệ thống.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md bg-slate-50">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tenLoai">Tên loại bảo lãnh</Label>
                            <Input
                                id="tenLoai"
                                value={tenLoai}
                                onChange={(e) => setTenLoai(e.target.value)}
                                placeholder="VD: Bảo lãnh thực hiện hợp đồng"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ghiChu">Ghi chú</Label>
                            <Input
                                id="ghiChu"
                                value={ghiChu}
                                onChange={(e) => setGhiChu(e.target.value)}
                                placeholder="Nhập ghi chú nếu có"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        {editingType && (
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Hủy
                            </Button>
                        )}
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingType ? "Cập nhật" : "Thêm mới"}
                        </Button>
                    </div>
                </form>

                <div className="rounded-md border mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên loại</TableHead>
                                <TableHead>Ghi chú</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4">Đang tải...</TableCell>
                                </TableRow>
                            ) : types.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4">Chưa có loại bảo lãnh nào</TableCell>
                                </TableRow>
                            ) : (
                                types.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">{type.tenLoai}</TableCell>
                                        <TableCell>{type.ghiChu || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(type)}>
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
