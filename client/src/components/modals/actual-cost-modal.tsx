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
import { NumericFormatInput } from "@/components/ui/numeric-format-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { insertChiPhiThucTeSchema, InsertChiPhiThucTe, ChiPhiThucTe, HopDong, LoaiChiPhi } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ActualCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    record?: ChiPhiThucTe | null;
}

export default function ActualCostModal({
    isOpen,
    onClose,
    mode,
    record,
}: ActualCostModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: costTypes = [] } = useQuery<LoaiChiPhi[]>({
        queryKey: ["/api/loai-chi-phi"],
    });

    const form = useForm<InsertChiPhiThucTe>({
        resolver: zodResolver(insertChiPhiThucTeSchema),
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
        mutationFn: async (data: InsertChiPhiThucTe) => {
            if (mode === "edit" && record) {
                return await apiRequest("PUT", `/api/chi-phi-thuc-te/${record.id}`, data);
            }
            return await apiRequest("POST", "/api/chi-phi-thuc-te", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/chi-phi-thuc-te"] });
            toast({
                description: mode === "create" ? "Đã thêm chi phí thực tế thành công" : "Đã cập nhật chi phí thực tế thành công",
            });
            onClose();
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Thêm chi phí thực tế" : "Sửa chi phí thực tế"}
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
                                        <NumericFormatInput
                                            placeholder="Nhập trị giá"
                                            value={field.value}
                                            onChange={field.onChange}
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
