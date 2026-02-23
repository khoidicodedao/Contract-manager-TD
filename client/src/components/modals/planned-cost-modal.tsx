import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { insertChiPhiTheoHopDongSchema, InsertChiPhiTheoHopDong, ChiPhiTheoHopDong, HopDong, LoaiChiPhi } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface PlannedCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    record?: ChiPhiTheoHopDong | null;
}

export default function PlannedCostModal({
    isOpen,
    onClose,
    mode,
    record,
}: PlannedCostModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: costTypes = [] } = useQuery<LoaiChiPhi[]>({
        queryKey: ["/api/loai-chi-phi"],
    });

    const form = useForm<InsertChiPhiTheoHopDong>({
        resolver: zodResolver(insertChiPhiTheoHopDongSchema),
        defaultValues: {
            hopDongId: 0,
            loaiChiPhiId: 0,
            ngayThucHien: "",
            triGia: 0,
            ghiChu: "",
        },
    });

    useEffect(() => {
        if (record) {
            form.reset({
                hopDongId: record.hopDongId,
                loaiChiPhiId: record.loaiChiPhiId,
                ngayThucHien: record.ngayThucHien || "",
                triGia: record.triGia || 0,
                ghiChu: record.ghiChu || "",
            });
        } else {
            form.reset({
                hopDongId: contracts[0]?.id || 0,
                loaiChiPhiId: costTypes[0]?.id || 0,
                ngayThucHien: new Date().toISOString().split("T")[0],
                triGia: 0,
                ghiChu: "",
            });
        }
    }, [record, form, contracts, costTypes]);

    const mutation = useMutation({
        mutationFn: async (data: InsertChiPhiTheoHopDong) => {
            if (mode === "edit" && record) {
                return await apiRequest("PUT", `/api/chi-phi-theo-hop-dong/${record.id}`, data);
            }
            return await apiRequest("POST", "/api/chi-phi-theo-hop-dong", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/chi-phi-theo-hop-dong"] });
            toast({
                description: mode === "create" ? "Đã thêm chi phí theo hợp đồng thành công" : "Đã cập nhật chi phí theo hợp đồng thành công",
            });
            onClose();
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Thêm chi phí theo hợp đồng" : "Sửa chi phí theo hợp đồng"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                        className="grid grid-cols-2 gap-4"
                    >
                        <FormField
                            control={form.control}
                            name="hopDongId"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>Hợp đồng *</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(parseInt(val))}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn hợp đồng" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {contracts.map((contract) => (
                                                <SelectItem key={contract.id} value={contract.id.toString()}>
                                                    {contract.soHdNgoai || contract.soHdNoi} - {contract.ten}
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
                            name="loaiChiPhiId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại chi phí *</FormLabel>
                                    <Select
                                        onValueChange={(val) => field.onChange(parseInt(val))}
                                        value={field.value?.toString()}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn loại chi phí" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {costTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.tenLoai}
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
                            name="ngayThucHien"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày thực hiện</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="triGia"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trị giá</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Nhập trị giá"
                                            {...field}
                                            value={field.value ?? 0}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                <FormItem className="col-span-2">
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nhập ghi chú" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4 col-span-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Đang xử lý..." : mode === "create" ? "Thêm mới" : "Cập nhật"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
