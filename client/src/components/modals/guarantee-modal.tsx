"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileAttachmentSection } from "@/components/ui/file-attachment-section";
import { uploadFileAsDocument } from "@/lib/file-upload";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBaoLanhSchema, BaoLanh, InsertBaoLanh } from "@shared/schema";

interface GuaranteeModalProps {
    isOpen: boolean;
    onClose: () => void;
    record?: BaoLanh | null;
    mode?: "create" | "edit" | "view";
}

export default function GuaranteeModal({
    isOpen,
    onClose,
    record,
    mode = "create",
}: GuaranteeModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data: contracts = [] } = useQuery<any[]>({
        queryKey: ["/api/hop-dong"],
    });

    const { data: loaiBaoLanh = [] } = useQuery<any[]>({
        queryKey: ["/api/loai-bao-lanh"],
    });

    const form = useForm<InsertBaoLanh>({
        resolver: zodResolver(insertBaoLanhSchema),
        defaultValues: record
            ? {
                hopDongId: record.hopDongId,
                soBaoLanh: record.soBaoLanh || "",
                loaiBaoLanhId: record.loaiBaoLanhId || 0,
                triGia: record.triGia || 0,
                tyGia: record.tyGia || 1,
                tyLe: record.tyLe || 0,
                nguoiThuHuong: record.nguoiThuHuong || "",
                ngayCap: record.ngayCap || "",
                thoiHan: record.thoiHan || "",
                ghiChu: record.ghiChu || "",
                fileScan: record.fileScan || "",
            }
            : {
                hopDongId: 0,
                soBaoLanh: "",
                loaiBaoLanhId: 0,
                triGia: 0,
                tyGia: 1,
                tyLe: 0,
                nguoiThuHuong: "",
                ngayCap: "",
                thoiHan: "",
                ghiChu: "",
                fileScan: "",
            },
    });

    const createOrUpdateMutation = useMutation({
        mutationFn: async (data: InsertBaoLanh) => {
            let updatedData = { ...data };

            // Nếu có file được chọn, upload file trước
            if (selectedFile) {
                const url = await uploadFileAsDocument(
                    selectedFile,
                    data.hopDongId,
                    `File đính kèm từ Bảo lãnh: ${data.soBaoLanh}`
                );
                if (url) {
                    updatedData.fileScan = url;
                }
            }

            if (record) {
                return await apiRequest("PUT", `/api/bao-lanh/${record.id}`, updatedData);
            } else {
                return await apiRequest("POST", "/api/bao-lanh", updatedData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/bao-lanh"] });
            queryClient.invalidateQueries({ queryKey: ["/api/file-hop-dong"] });
            toast({
                title: "Thành công",
                description: record
                    ? "Bảo lãnh đã được cập nhật"
                    : "Bảo lãnh đã được thêm mới",
            });
            setSelectedFile(null);
            onClose();
            form.reset();
        },
        onError: () => {
            toast({
                title: "Lỗi",
                description: "Không thể lưu bảo lãnh",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertBaoLanh) => {
        createOrUpdateMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "view"
                            ? "Xem chi tiết bảo lãnh"
                            : mode === "edit"
                                ? "Chỉnh sửa bảo lãnh"
                                : "Thêm bảo lãnh mới"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Hợp đồng */}
                            <FormField
                                control={form.control}
                                name="hopDongId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hợp đồng</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(parseInt(val))}
                                            value={field.value?.toString()}
                                            disabled={mode === "view"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn hợp đồng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {contracts?.map((c: any) => (
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

                            {/* Số bảo lãnh */}
                            <FormField
                                control={form.control}
                                name="soBaoLanh"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số bảo lãnh</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Nhập số bảo lãnh..."
                                                {...field}
                                                value={field.value ?? ""}
                                                disabled={mode === "view"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Loại bảo lãnh */}
                            <FormField
                                control={form.control}
                                name="loaiBaoLanhId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại bảo lãnh</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(parseInt(val))}
                                            value={field.value?.toString()}
                                            disabled={mode === "view"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại bảo lãnh" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {loaiBaoLanh?.map((l: any) => (
                                                    <SelectItem key={l.id} value={l.id.toString()}>
                                                        {l.tenLoai}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Tỷ lệ (%) */}
                            <FormField
                                control={form.control}
                                name="tyLe"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tỷ lệ (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                disabled={mode === "view"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Trị giá */}
                            <FormField
                                control={form.control}
                                name="triGia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trị giá</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                {...field}
                                                value={field.value ?? 0}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                disabled={mode === "view"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Tỷ giá */}
                            <FormField
                                control={form.control}
                                name="tyGia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tỷ giá</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                {...field}
                                                value={field.value ?? 1}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                disabled={mode === "view"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Người thụ hưởng */}
                        <FormField
                            control={form.control}
                            name="nguoiThuHuong"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Người thụ hưởng</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nhập tên người thụ hưởng..."
                                            {...field}
                                            value={field.value ?? ""}
                                            disabled={mode === "view"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Ngày cấp */}
                            <FormField
                                control={form.control}
                                name="ngayCap"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày cấp</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                value={field.value ?? ""}
                                                disabled={mode === "view"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Thời hạn */}
                            <FormField
                                control={form.control}
                                name="thoiHan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thời hạn</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                {...field}
                                                value={field.value ?? ""}
                                                disabled={mode === "view"}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Ghi chú */}
                        <FormField
                            control={form.control}
                            name="ghiChu"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập ghi chú..."
                                            {...field}
                                            value={field.value ?? ""}
                                            disabled={mode === "view"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Hồ sơ đính kèm */}
                        <FileAttachmentSection
                            selectedFile={selectedFile}
                            onFileSelect={setSelectedFile}
                            existingFileUrl={record?.fileScan}
                            mode={mode}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                {mode === "view" ? "Đóng" : "Hủy"}
                            </Button>
                            {mode !== "view" && (
                                <Button
                                    type="submit"
                                    disabled={createOrUpdateMutation.isPending}
                                >
                                    {createOrUpdateMutation.isPending
                                        ? "Đang lưu..."
                                        : record
                                            ? "Cập nhật"
                                            : "Tạo mới"}
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
