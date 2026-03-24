import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { LoaiTien } from "@shared/schema";

export default function CurrencyTypes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] =
    useState<LoaiTien | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currencies = [] } = useQuery<LoaiTien[]>({
    queryKey: ["/api/loai-tien"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<LoaiTien, "id">) => {
      await apiRequest("POST", "/api/loai-tien", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loai-tien"] });
      setIsCreateOpen(false);
      toast({ description: "Đã tạo loại tiền thành công" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Lỗi khi tạo loại tiền",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LoaiTien) => {
      await apiRequest("PUT", `/api/loai-tien/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loai-tien"] });
      setIsEditOpen(false);
      setEditingCurrency(null);
      toast({ description: "Đã cập nhật loại tiền thành công" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Lỗi khi cập nhật loại tiền",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/loai-tien/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loai-tien"] });
      toast({ description: "Đã xóa loại tiền thành công" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Lỗi khi xóa loại tiền",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const data = {
      ten: formData.get("ten") as string,
    };

    if (editingCurrency) {
      updateMutation.mutate({ ...data, id: editingCurrency.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (currency: LoaiTien) => {
    setEditingCurrency(currency);
    setIsEditOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCurrency(null);
    setIsCreateOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Quản lý loại tiền"
          subtitle="Quản lý các loại tiền tệ sử dụng trong hệ thống (USD, EUR, VND...)"
          onCreateContract={() => {}}
        />
        <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog} className="shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm loại tiền
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thêm loại tiền mới</DialogTitle>
                      <DialogDescription>
                        Nhập ký hiệu hoặc tên loại tiền mới (VD: USD, VND, EUR)
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ten">Tên loại tiền</Label>
                        <Input
                          id="ten"
                          name="ten"
                          placeholder="Ví dụ: USD"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateOpen(false)}
                        >
                          Hủy
                        </Button>
                        <Button type="submit">Tạo</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tổng loại tiền
                    </CardTitle>
                    <Coins className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {currencies.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Đang được sử dụng trong hệ thống
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Danh sách loại tiền</CardTitle>
                  <CardDescription>
                    Thêm, sửa hoặc xóa các loại tiền tệ dùng cho giá trị hợp đồng và thanh toán.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Tên / Ký hiệu loại tiền</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currencies.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-slate-500 italic">
                              Chưa có loại tiền nào được định nghĩa.
                            </TableCell>
                          </TableRow>
                        ) : (
                          currencies.map((currency) => (
                            <TableRow key={currency.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{currency.id}</Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-slate-700">
                                {currency.ten}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => openEditDialog(currency)}
                                    title="Sửa"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm(`Bạn có chắc muốn xóa loại tiền ${currency.ten}?`)) {
                                        deleteMutation.mutate(currency.id);
                                      }
                                    }}
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Dialog */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa loại tiền</DialogTitle>
                    <DialogDescription>
                      Cập nhật tên hoặc ký hiệu loại tiền
                    </DialogDescription>
                  </DialogHeader>
                  {editingCurrency && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ten">Tên loại tiền</Label>
                        <Input
                          id="ten"
                          name="ten"
                          defaultValue={editingCurrency.ten}
                          placeholder="Ví dụ: USD"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditOpen(false)}
                        >
                          Hủy
                        </Button>
                        <Button type="submit">Cập nhật</Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
