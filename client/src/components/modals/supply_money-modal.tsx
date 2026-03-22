"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericFormatInput } from "@/components/ui/numeric-format-input";
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
import { insertCapTienSchema, CapTien, InsertCapTien } from "@shared/schema";

interface CapTienModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: CapTien | null;
  mode?: "create" | "edit" | "view";
}

export default function CapTienModal({
  isOpen,
  onClose,
  record,
  mode = "create",
}: CapTienModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["/api/hop-dong"],
  });

  const { data: loaiTien = [] } = useQuery<any[]>({
    queryKey: ["/api/loai-tien"],
  });

  const form = useForm<InsertCapTien>({
    resolver: zodResolver(insertCapTienSchema),
    defaultValues: record
      ? {
        ngayCap: record.ngayCap || "",
        hopDongId: record.hopDongId,
        soTien: record.soTien,
        loaiTienId: record.loaiTienId,
        tyGia: record.tyGia ?? null,
        ghiChu: record.ghiChu || "",
        benCap: record.benCap || "",
        soTienQuyDoi: record.soTienQuyDoi || 0,
        loaiTienQuyDoi: record.loaiTienQuyDoi || "VND",
      }
      : {
        ngayCap: "",
        hopDongId: 0,
        soTien: 0,
        loaiTienId: 3, // default VND
        tyGia: null,
        ghiChu: "",
        benCap: "",
        soTienQuyDoi: 0,
        loaiTienQuyDoi: "VND",
      },
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (record) {
        return await apiRequest("PUT", `/api/cap-tien/${record.id}`, data);
      } else {
        return await apiRequest("POST", "/api/cap-tien", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cap-tien"] });
      toast({
        title: "Thành công",
        description: record
          ? "Cấp tiền đã được cập nhật"
          : "Cấp tiền đã được thêm mới",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cấp tiền",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCapTien) => {
    createOrUpdateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "view"
              ? "Xem chi tiết cấp tiền"
              : mode === "edit"
                ? "Chỉnh sửa cấp tiền"
                : "Thêm cấp tiền mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={mode === "view"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            {c.soHdNgoai}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Số tiền */}
            <FormField
              control={form.control}
              name="soTien"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền</FormLabel>
                  <FormControl>
                    <NumericFormatInput
                      value={field.value}
                      onChange={field.onChange}
                      disabled={mode === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loại tiền */}
            <FormField
              control={form.control}
              name="loaiTienId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại tiền</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    value={field.value?.toString()}
                    disabled={mode === "view"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại tiền" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loaiTien?.map((lt: any) => (
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
                      step="0.01"
                      {...field}
                      value={field.value === null || field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        field.onChange(isNaN(v) ? null : v);
                      }}
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
                      value={field.value === null || field.value === undefined ? "" : field.value}
                      disabled={mode === "view"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 border-t pt-2 mt-2">
              <h4 className="text-sm font-semibold text-rose-600 mb-4">Thông tin bổ sung</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Bên cấp */}
                <FormField
                  control={form.control}
                  name="benCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bên cấp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên bên cấp..."
                          {...field}
                          value={field.value === null || field.value === undefined ? "" : field.value}
                          disabled={mode === "view"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Số tiền quy đổi */}
                <FormField
                  control={form.control}
                  name="soTienQuyDoi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền quy đổi</FormLabel>
                      <FormControl>
                        <NumericFormatInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={mode === "view"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Loại tiền quy đổi */}
                <FormField
                  control={form.control}
                  name="loaiTienQuyDoi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại tiền quy đổi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? "VNĐ"}
                        disabled={mode === "view"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại tiền" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="VNĐ">VNĐ</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
