import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { NumericFormatInput } from "@/components/ui/numeric-format-input";
import { apiRequest } from "@/lib/queryClient";
import {
    DoanRaVao,
    insertDoanRaVaoSchema,
    HopDong,
    LoaiDoanRaVao,
    LoaiTien
} from "@shared/schema";
import { useEffect } from "react";

interface MissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mission?: DoanRaVao | null;
}

export default function MissionModal({
    isOpen,
    onClose,
    mission,
}: MissionModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: missionTypes = [] } = useQuery<LoaiDoanRaVao[]>({
        queryKey: ["/api/loai-doan-ra-vao"],
    });

    const { data: loaiTien = [] } = useQuery<LoaiTien[]>({
        queryKey: ["/api/loai-tien"],
    });

    const form = useForm({
        resolver: zodResolver(insertDoanRaVaoSchema),
        defaultValues: {
            loaiDoanId: 0,
            hopDongId: 0,
            tenDoan: "",
            chiPhi: 0,
            loaiTienId: 0,
            tyGia: 1,
            ghiChu: "",
        },
    });

    useEffect(() => {
        if (mission) {
            form.reset({
                ...mission,
                chiPhi: Number(mission.chiPhi) || 0,
                tyGia: Number(mission.tyGia) || 1,
                ghiChu: mission.ghiChu ?? "",
                hopDongId: mission.hopDongId ?? 0,
                loaiDoanId: mission.loaiDoanId ?? 0,
                loaiTienId: mission.loaiTienId ?? 0,
            } as any);
        } else {
            form.reset({
                loaiDoanId: missionTypes[0]?.id || 0,
                hopDongId: contracts[0]?.id || 0,
                loaiTienId: loaiTien[0]?.id || 0,
                tenDoan: "",
                chiPhi: 0,
                tyGia: 1,
                ghiChu: "",
            } as any);
        }
    }, [mission, isOpen, contracts, missionTypes, loaiTien]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (mission) {
                return await apiRequest("PUT", `/api/doan-ra-vao/${mission.id}`, data);
            }
            return await apiRequest("POST", "/api/doan-ra-vao", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/doan-ra-vao"] });
            toast({
                title: "Thành công",
                description: mission ? "Đã cập nhật thông tin đoàn" : "Đã thêm đoàn mới",
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
                    <DialogTitle>
                        {mission ? "Chỉnh sửa đoàn ra/vào" : "Thêm đoàn ra/vào mới"}
                    </DialogTitle>
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
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn hợp đồng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {contracts.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.soHdNgoai || c.soHdNoi} - {c.ten}
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
                                name="loaiDoanId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại đoàn</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại đoàn" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {missionTypes.map((t) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        [{t.phanLoai}] {t.tenLoai}
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
                            name="tenDoan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên đoàn</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tên đoàn ra/vào" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="chiPhi"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chi phí</FormLabel>
                                        <FormControl>
                                            <NumericFormatInput 
                                                value={field.value} 
                                                onChange={field.onChange} 
                                                placeholder="Nhập chi phí"
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
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tiền tệ" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {loaiTien.map((t) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        {t.ten}
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
                                name="tyGia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tỷ giá</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="ghiChu"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nhập ghi chú (nếu có)" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mission ? "Cập nhật" : "Lưu lại"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
