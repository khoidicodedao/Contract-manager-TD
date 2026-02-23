import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { insertHoaDonSchema, type HoaDon, type LoaiHoaDon, type HopDong, type LoaiTien } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice?: HoaDon;
}

export default function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: loaiHoaDon = [] } = useQuery<LoaiHoaDon[]>({
        queryKey: ["/api/loai-hoa-don"],
    });

    const { data: hopDong = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: loaiTien = [] } = useQuery<LoaiTien[]>({
        queryKey: ["/api/loai-tien"],
    });

    const form = useForm({
        resolver: zodResolver(insertHoaDonSchema),
        defaultValues: {
            loaiHoaDonId: 0,
            tenHoaDon: "",
            ngayHoaDon: new Date().toISOString().split("T")[0],
            triGia: 0,
            loaiTienId: 0,
            tyGia: 1,
            ghiChu: "",
            hopDongId: 0,
        },
    });

    useEffect(() => {
        if (invoice) {
            form.reset({
                ...invoice,
                ngayHoaDon: invoice.ngayHoaDon || new Date().toISOString().split("T")[0],
                triGia: Number(invoice.triGia) || 0,
                tyGia: Number(invoice.tyGia) || 1,
                loaiTienId: invoice.loaiTienId ?? 0,
                ghiChu: invoice.ghiChu ?? "",
                hopDongId: invoice.hopDongId ?? 0,
            } as any);
        } else {
            form.reset({
                loaiHoaDonId: loaiHoaDon[0]?.id || 0,
                tenHoaDon: "",
                ngayHoaDon: new Date().toISOString().split("T")[0],
                triGia: 0,
                loaiTienId: loaiTien.find(t => t.ten === "VNĐ")?.id || loaiTien[0]?.id || 0,
                tyGia: 1,
                ghiChu: "",
                hopDongId: 0,
            });
        }
    }, [invoice, isOpen, loaiHoaDon, loaiTien, form]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (invoice) {
                return await apiRequest("PATCH", `/api/hoa-don/${invoice.id}`, data);
            }
            return await apiRequest("POST", "/api/hoa-don", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hoa-don"] });
            toast({
                title: "Thành công",
                description: `Hóa đơn đã được ${invoice ? "cập nhật" : "tạo mới"}`,
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{invoice ? "Chỉnh sửa hóa đơn" : "Thêm hóa đơn mới"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="hopDongId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hợp đồng</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn hợp đồng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {hopDong.map((hd) => (
                                                    <SelectItem key={hd.id} value={hd.id.toString()}>
                                                        {hd.soHdNgoai || hd.soHdNoi} - {hd.ten}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="loaiHoaDonId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại hóa đơn</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại hóa đơn" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {loaiHoaDon.map((lhd) => (
                                                    <SelectItem key={lhd.id} value={lhd.id.toString()}>
                                                        {lhd.ten}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="tenHoaDon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên/Số hóa đơn</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Nhập tên hoặc số hóa đơn..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ngayHoaDon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày hóa đơn</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <FormField
                                    control={form.control}
                                    name="triGia"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Trị giá</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="loaiTienId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loại tiền</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(Number(val))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Tiền" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {loaiTien.map((lt) => (
                                                        <SelectItem key={lt.id} value={lt.id.toString()}>
                                                            {lt.ten}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="tyGia"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tỷ giá</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ghiChu"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {invoice ? "Cập nhật" : "Lưu"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
