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
import { apiRequest } from "@/lib/queryClient";
import {
    VanBanPhapLy,
    insertVanBanPhapLySchema,
    HopDong,
    LoaiVanBanPhapLy
} from "@shared/schema";
import { useEffect } from "react";

interface LegalDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    document?: VanBanPhapLy | null;
}

export default function LegalDocumentModal({
    isOpen,
    onClose,
    document,
}: LegalDocumentModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: contracts = [] } = useQuery<HopDong[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: documentTypes = [] } = useQuery<LoaiVanBanPhapLy[]>({
        queryKey: ["/api/loai-van-ban-phap-ly"],
    });

    const form = useForm({
        resolver: zodResolver(insertVanBanPhapLySchema),
        defaultValues: {
            loaiVanBanId: 0,
            hopDongId: 0,
            tenVanBan: "",
            ngayVanBan: new Date().toISOString().split("T")[0],
            ghiChu: "",
        },
    });

    useEffect(() => {
        if (document) {
            form.reset({
                ...document,
                ngayVanBan: document.ngayVanBan || new Date().toISOString().split("T")[0],
                ghiChu: document.ghiChu ?? "",
                hopDongId: document.hopDongId ?? 0,
                loaiVanBanId: document.loaiVanBanId ?? 0,
            } as any);
        } else {
            form.reset({
                loaiVanBanId: documentTypes[0]?.id || 0,
                hopDongId: contracts[0]?.id || 0,
                tenVanBan: "",
                ngayVanBan: new Date().toISOString().split("T")[0],
                ghiChu: "",
            } as any);
        }
    }, [document, isOpen, contracts, documentTypes]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (document) {
                return await apiRequest("PUT", `/api/van-ban-phap-ly/${document.id}`, data);
            }
            return await apiRequest("POST", "/api/van-ban-phap-ly", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/van-ban-phap-ly"] });
            toast({
                title: "Thành công",
                description: document ? "Đã cập nhật văn bản" : "Đã thêm văn bản mới",
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
                        {document ? "Chỉnh sửa văn bản pháp lý" : "Thêm văn bản pháp lý mới"}
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
                                name="loaiVanBanId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại văn bản</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại văn bản" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {documentTypes.map((t) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        {t.tenLoaiPhapLy}
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
                            name="tenVanBan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên văn bản</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tên văn bản pháp lý" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ngayVanBan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày văn bản</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
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
                                {document ? "Cập nhật" : "Lưu lại"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
