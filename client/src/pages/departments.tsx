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
import { Building2, Search, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DepartmentModal from "@/components/modals/department-modal";

export default function Departments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Kiểm tra quyền (có thể skip nếu backend đã chặn, nhưng để an toàn hiển thị)
  const { data: user } = useQuery<{ role: string }>({
    queryKey: ["/api/user"],
  });

  const { data: departments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/phong-ban"],
  });

  const mutationParams = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phong-ban"] });
      toast({ title: "Thành công", description: "Lưu phòng ban thành công" });
      setIsModalOpen(false);
      setSelectedDept(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu phòng ban",
        variant: "destructive",
      });
    },
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/phong-ban", data),
    ...mutationParams,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/phong-ban/${id}`, data),
    ...mutationParams,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/phong-ban/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/phong-ban"] });
      toast({ title: "Thành công", description: "Xóa phòng ban thành công" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phòng ban",
        variant: "destructive",
      });
    },
  });

  const filteredDepts = departments.filter(
    (dept) =>
      dept.ten?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm("Chắc chắn muốn xóa phòng ban này? (Tương lai có thể ảnh hưởng đến dữ liệu)")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedDept) {
      updateMutation.mutate({ id: selectedDept.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (user && user.role !== "admin") {
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
          title="Quản lý phòng ban"
          subtitle="Quản lý thông tin các phòng ban trong tổng công ty"
          icon={Building2}
          onCreateContract={() => setIsModalOpen(true)}
        />

        <main className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách phòng ban</CardTitle>
                <Button onClick={() => { setSelectedDept(null); setIsModalOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm phòng ban
                </Button>
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm theo tên hoặc mô tả..."
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
              ) : filteredDepts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">Chưa có dữ liệu phòng ban</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên phòng ban</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepts.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">#{dept.id}</TableCell>
                        <TableCell>{dept.ten}</TableCell>
                        <TableCell className="text-slate-500">{dept.moTa || "—"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-600"
                              onClick={() => {
                                setSelectedDept(dept);
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => handleDelete(dept.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        department={selectedDept}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
