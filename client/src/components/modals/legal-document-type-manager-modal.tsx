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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoaiVanBanPhapLy, HopDong } from "@shared/schema";

interface LegalDocTypeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LegalDocTypeManagerModal({
    isOpen,
    onClose,
}: LegalDocTypeManagerModalProps) {
    const [editingType, setEditingType] = useState<LoaiVanBanPhapLy | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documentTypes = [], isLoading } = useQuery<LoaiVanBanPhapLy[]>({
        queryKey: ["/api/loai-van-ban-phap-ly"],
    });

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("POST", "/api/loai-van-ban-phap-ly", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-van-ban-phap-ly"] });
            setIsFormOpen(false);
            setEditingType(null);
            toast({ description: "Đã tạo loại văn bản mới" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("PUT", `/api/loai-van-ban-phap-ly/${data.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-van-ban-phap-ly"] });
            setIsFormOpen(false);
            setEditingType(null);
            toast({ description: "Đã cập nhật loại văn bản" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-van-ban-phap-ly/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-van-ban-phap-ly"] });
            toast({ description: "Đã xóa loại văn bản" });
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = {
            tenLoaiPhapLy: formData.get("tenLoaiPhapLy") as string,
            ghiChu: formData.get("ghiChu") as string,
            hopDongId: formData.get("hopDongId") ? parseInt(formData.get("hopDongId") as string) : null,
        };

        if (editingType) {
            updateMutation.mutate({ ...data, id: editingType.id });
        } else {
            createMutation.mutate(data);
        }
    };

    const getContractInfo = (id: number | null) => {
        return contracts.find(c => c.id === id);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-indigo-600" /> Quản lý Loại văn bản pháp lý
                    </DialogTitle>
                    <DialogDescription>
                        Cấu hình các danh mục văn bản pháp lý.
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

                            <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0">
                                        <TableRow>
                                            <TableHead className="w-[80px]">Mã</TableHead>
                                            <TableHead>Tên loại</TableHead>
                                            <TableHead>Hợp đồng liên kết</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">Đang tải...</TableCell>
                                            </TableRow>
                                        ) : documentTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-slate-400">Chưa có dữ liệu</TableCell>
                                            </TableRow>
                                        ) : (
                                            documentTypes.map((type) => {
                                                const contract = getContractInfo(type.hopDongId);
                                                return (
                                                    <TableRow key={type.id}>
                                                        <TableCell>
                                                            <Badge variant="outline" className="font-mono text-[10px]">#{type.id}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{type.tenLoaiPhapLy}</TableCell>
                                                        <TableCell className="text-sm">
                                                            {contract ? (
                                                                <span className="text-indigo-600 font-medium">
                                                                    {contract.soHdNgoai || contract.soHdNoi}
                                                                </span>
                                                            ) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-500 truncate max-w-[150px]">{type.ghiChu || "-"}</TableCell>
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
                                                                        if (confirm("Xóa loại văn bản này?")) {
                                                                            deleteMutation.mutate(type.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
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
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <h4 className="font-semibold text-sm border-b pb-2 mb-4">
                                {editingType ? "Chỉnh sửa loại văn bản" : "Thêm loại văn bản mới"}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tenLoaiPhapLy">Tên loại văn bản</Label>
                                    <Input
                                        id="tenLoaiPhapLy"
                                        name="tenLoaiPhapLy"
                                        defaultValue={editingType?.tenLoaiPhapLy}
                                        placeholder="Ví dụ: Giấy phép xuất khẩu..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hopDongId">Hợp đồng liên kết (Không bắt buộc)</Label>
                                    <Select name="hopDongId" defaultValue={editingType?.hopDongId?.toString()}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn hợp đồng (tùy chọn)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Không liên kết</SelectItem>
                                            {contracts.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.soHdNgoai || c.soHdNoi} - {c.ten}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
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
