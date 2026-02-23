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
import { insertLoaiChiPhiSchema, InsertLoaiChiPhi, LoaiChiPhi } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface CostTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    record?: LoaiChiPhi | null;
}

export default function CostTypeModal({
    isOpen,
    onClose,
    mode,
    record,
}: CostTypeModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<InsertLoaiChiPhi>({
        resolver: zodResolver(insertLoaiChiPhiSchema),
        defaultValues: {
            maLoai: "",
            tenLoai: "",
            ghiChu: "",
        },
    });

    useEffect(() => {
        if (record) {
            form.reset({
                maLoai: record.maLoai || "",
                tenLoai: record.tenLoai,
                ghiChu: record.ghiChu || "",
            });
        } else {
            form.reset({
                maLoai: "",
                tenLoai: "",
                ghiChu: "",
            });
        }
    }, [record, form]);

    const mutation = useMutation({
        mutationFn: async (data: InsertLoaiChiPhi) => {
            if (mode === "edit" && record) {
                return await apiRequest("PUT", `/api/loai-chi-phi/${record.id}`, data);
            }
            return await apiRequest("POST", "/api/loai-chi-phi", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/loai-chi-phi"] });
            toast({
                description: mode === "create" ? "Đã thêm loại chi phí thành công" : "Đã cập nhật loại chi phí thành công",
            });
            onClose();
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Thêm loại chi phí" : "Sửa loại chi phí"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="maLoai"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã loại</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập mã loại chi phí" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tenLoai"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên loại *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tên loại chi phí" {...field} />
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
                                        <Textarea placeholder="Nhập ghi chú" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end space-x-2 pt-4">
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
