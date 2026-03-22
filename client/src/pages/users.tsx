import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Edit, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  grand_commander: "Chỉ huy Tổng công ty",
  dept_commander: "Chỉ huy Phòng",
  assistant: "Trợ lý",
};

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("assistant");
  const [phongBanId, setPhongBanId] = useState<string>("none");
  const [canBoId, setCanBoId] = useState<string>("none");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<{ role: string }>({
    queryKey: ["/api/user"],
  });

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/phong-ban"],
  });

  const { data: staffList = [] } = useQuery<any[]>({
    queryKey: ["/api/can-bo"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) =>
      apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Thành công", description: "Tạo tài khoản thành công" });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài khoản",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Thành công", description: "Cập nhật tài khoản thành công" });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật tài khoản",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Thành công", description: "Đã xóa tài khoản" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa tài khoản",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("assistant");
    setPhongBanId("none");
    setCanBoId("none");
  };

  const handleAddClick = () => {
    setSelectedUser(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (userItem: any) => {
    setSelectedUser(userItem);
    setUsername(userItem.username);
    setPassword(""); // Không load pass cũ
    setRole(userItem.role);
    setPhongBanId(userItem.phongBanId ? String(userItem.phongBanId) : "none");
    setCanBoId(userItem.canBoId ? String(userItem.canBoId) : "none");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên đăng nhập", variant: "destructive" });
      return;
    }
    
    const payloadData = {
      username,
      password: password || undefined, // chỉ gửi nếu có nhập (cho update)
      role,
      phongBanId: phongBanId === "none" ? null : Number(phongBanId),
      canBoId: canBoId === "none" ? null : Number(canBoId),
    };

    if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        data: payloadData,
      });
    } else {
      if (!password) {
        toast({ title: "Lỗi", description: "Vui lòng nhập mật khẩu", variant: "destructive" });
        return;
      }
      createMutation.mutate(payloadData);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold">Góc truy cập bị từ chối</h2>
          <p className="text-slate-500 mt-2">Tính năng này chỉ dành cho Quản trị viên</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Quản lý Người dùng & Phân quyền"
          subtitle="Tạo tài khoản và liên kết với cán bộ"
          icon={Users}
          onCreateContract={handleAddClick}
        />

        <main className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách tài khoản</CardTitle>
                <Button onClick={handleAddClick}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm tài khoản
                </Button>
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm theo tên đăng nhập..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">Không tìm thấy tài khoản nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đăng nhập</TableHead>
                      <TableHead>Chức vụ (Quyền)</TableHead>
                      <TableHead>Cán bộ (Nhân sự)</TableHead>
                      <TableHead>Phòng ban trực thuộc</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const dept = departments.find((d) => d.id === u.phongBanId);
                      const cb = staffList.find((c) => c.id === u.canBoId);
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.username}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-800 font-medium">
                            {cb ? cb.ten : <span className="text-slate-400">Không liên kết</span>}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {dept ? dept.ten : "Không gắn phòng nào"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-600"
                                onClick={() => handleEditClick(u)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteClick(u.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên đăng nhập *</label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                disabled={!!selectedUser} 
                placeholder="Ví dụ: nva_admin"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {selectedUser ? "Mật khẩu (để trống nếu không đổi)" : "Mật khẩu *"}
              </label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Liên kết Cán bộ</label>
              <Select value={canBoId} onValueChange={setCanBoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cán bộ định danh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">--- Không liên kết ---</SelectItem>
                  {staffList.map((cb: any) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>
                      {cb.ten} {cb.chucVu ? `(${cb.chucVu})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quyền hạn</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên (Xem toàn bộ, quản lý hệ thống)</SelectItem>
                  <SelectItem value="grand_commander">Chỉ huy TCT (Xem toàn bộ)</SelectItem>
                  <SelectItem value="dept_commander">Chỉ huy Phòng (Chỉ xem/sửa phòng mình)</SelectItem>
                  <SelectItem value="assistant">Trợ lý (Chỉ xem/sửa phòng mình)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(role === "dept_commander" || role === "assistant") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Phòng ban cấp quyền</label>
                <Select value={phongBanId} onValueChange={setPhongBanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">--- Không gắn phòng ---</SelectItem>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.ten}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Tài khoản có quyền Chỉ huy/Trợ lý bắt buộc phải gắn Phòng ban để lọc dữ liệu.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending}>
                {(updateMutation.isPending || createMutation.isPending) ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
