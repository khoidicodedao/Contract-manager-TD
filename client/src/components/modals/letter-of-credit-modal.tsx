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
import { insertThuTinDungSchema, ThuTinDung, InsertThuTinDung } from "@shared/schema";

interface LetterOfCreditModalProps {
    isOpen: boolean;
    onClose: () => void;
    record?: ThuTinDung | null;
    mode?: "create" | "edit" | "view";
}

export default function LetterOfCreditModal({
    isOpen,
    onClose,
    record,
    mode = "create",
}: LetterOfCreditModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data: contracts = [] } = useQuery<any[]>({
        queryKey: ["/api/hop-dong"],
    });

    const form = useForm<InsertThuTinDung>({
        resolver: zodResolver(insertThuTinDungSchema),
        defaultValues: record
            ? {
                hopDongId: record.hopDongId,
                soLc: record.soLc || "",
                ngayMo: record.ngayMo || "",
                triGia: record.triGia || 0,
                tyGia: record.tyGia || 1,
                thoiHan: record.thoiHan || "",
                nguoiThuHuong: record.nguoiThuHuong || "",
                ghiChu: record.ghiChu || "",
                fileScan: record.fileScan || "",
            }
            : {
                hopDongId: 0,
                soLc: "",
                ngayMo: "",
                triGia: 0,
                tyGia: 1,
                thoiHan: "",
                nguoiThuHuong: "",
                ghiChu: "",
                fileScan: "",
            },
    });

    const createOrUpdateMutation = useMutation({
        mutationFn: async (data: InsertThuTinDung) => {
            const updatedData = { ...data };
            if (selectedFile) {
                const url = await uploadFileAsDocument(
                    selectedFile,
                    data.hopDongId,
                    `File đính kèm từ Thư tín dụng: ${data.soLc}`
                );
                if (url) {
                    updatedData.fileScan = url;
                }
            }

            if (record) {
                return await apiRequest("PUT", `/api/thu-tin-dung/${record.id}`, updatedData);
            } else {
                return await apiRequest("POST", "/api/thu-tin-dung", updatedData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/thu-tin-dung"] });
            queryClient.invalidateQueries({ queryKey: ["/api/file-hop-dong"] });
            toast({
                title: "Thành công",
                description: record
                    ? "Thư tín dụng đã được cập nhật"
                    : "Thư tín dụng đã được thêm mới",
            });
            setSelectedFile(null);
            onClose();
            form.reset();
        },
        onError: () => {
            toast({
                title: "Lỗi",
                description: "Không thể lưu thư tín dụng",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertThuTinDung) => {
        createOrUpdateMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "view"
                            ? "Xem chi tiết thư tín dụng"
                            : mode === "edit"
                                ? "Chỉnh sửa thư tín dụng"
                                : "Thêm thư tín dụng mới"}
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

                            {/* Số LC */}
                            <FormField
                                control={form.control}
                                name="soLc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số thư tín dụng</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Nhập số LC..."
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
                            {/* Ngày mở */}
                            <FormField
                                control={form.control}
                                name="ngayMo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày mở</FormLabel>
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
