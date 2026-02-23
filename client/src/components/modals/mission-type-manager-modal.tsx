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
import { Edit, Trash2, Plus, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoaiDoanRaVao } from "@shared/schema";

interface MissionTypeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MissionTypeManagerModal({
    isOpen,
    onClose,
}: MissionTypeManagerModalProps) {
    const [editingType, setEditingType] = useState<LoaiDoanRaVao | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: missionTypes = [], isLoading } = useQuery<LoaiDoanRaVao[]>({
        queryKey: ["/api/loai-doan-ra-vao"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("POST", "/api/loai-doan-ra-vao", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-doan-ra-vao"] });
            setIsFormOpen(false);
            setEditingType(null);
            toast({ description: "Đã tạo loại đoàn mới" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("PUT", `/api/loai-doan-ra-vao/${data.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-doan-ra-vao"] });
            setIsFormOpen(false);
            setEditingType(null);
            toast({ description: "Đã cập nhật loại đoàn" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/loai-doan-ra-vao/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-doan-ra-vao"] });
            toast({ description: "Đã xóa loại đoàn" });
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = {
            tenLoai: formData.get("tenLoai") as string,
            phanLoai: formData.get("phanLoai") as string,
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
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-sky-600" /> Quản lý Loại đoàn ra/vào
                    </DialogTitle>
                    <DialogDescription>
                        Cấu hình danh mục các loại đoàn ra và đoàn vào.
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
                                    className="bg-sky-600 hover:bg-sky-700"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Thêm loại mới
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0">
                                        <TableRow>
                                            <TableHead className="w-[80px]">Mã</TableHead>
                                            <TableHead>Tên loại đoàn</TableHead>
                                            <TableHead>Phân loại</TableHead>
                                            <TableHead>Ghi chú</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4">Đang tải...</TableCell>
                                            </TableRow>
                                        ) : missionTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-slate-400">Chưa có dữ liệu</TableCell>
                                            </TableRow>
                                        ) : (
                                            missionTypes.map((type) => (
                                                <TableRow key={type.id}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-[10px]">#{type.id}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{type.tenLoai}</TableCell>
                                                    <TableCell>
                                                        <Badge className={type.phanLoai === "đoàn ra" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-sky-100 text-sky-700 border-sky-200"}>
                                                            {type.phanLoai}
                                                        </Badge>
                                                    </TableCell>
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
                                                                    if (confirm("Xóa loại đoàn này?")) {
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
                                {editingType ? "Chỉnh sửa loại đoàn" : "Thêm loại đoàn mới"}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tenLoai">Tên loại đoàn</Label>
                                    <Input
                                        id="tenLoai"
                                        name="tenLoai"
                                        defaultValue={editingType?.tenLoai}
                                        placeholder="Ví dụ: Đoàn khảo sát, Đoàn đàm phán..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phanLoai">Phân loại</Label>
                                    <Select name="phanLoai" defaultValue={editingType?.phanLoai || "đoàn ra"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn phân loại" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="đoàn ra">Đoàn ra</SelectItem>
                                            <SelectItem value="đoàn vào">Đoàn vào</SelectItem>
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
