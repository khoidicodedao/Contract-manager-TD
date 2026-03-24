import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Search, FileText } from "lucide-react";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: currentUser } = useQuery<{ role: string }>({
    queryKey: ["/api/user"],
  });

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

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

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const username = users.find(u => u.id === log.userId)?.username || String(log.userId);
    return (
      log.details?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.targetType?.toLowerCase().includes(term) ||
      username.toLowerCase().includes(term) ||
      (log.hopDongId && String(log.hopDongId).includes(term)) ||
      (log.tenHopDong && log.tenHopDong.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Lịch sử hoạt động"
          subtitle="Theo dõi chi tiết các thao tác thêm/sửa/xóa trên hệ thống"
          icon={Clock}
        />

        <main className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bản ghi hệ thống (Audit Logs)</CardTitle>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm theo thao tác, chi tiết hoặc ID hợp đồng..."
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
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">Không tìm thấy bản ghi log nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Đôí tượng</TableHead>
                      <TableHead>Hợp đồng</TableHead>
                      <TableHead>Chi tiết chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const user = users.find((u) => u.id === log.userId);
                      const actionColor = 
                        log.action === "create" ? "text-green-600 bg-green-100" :
                        log.action === "update" ? "text-blue-600 bg-blue-100" :
                        log.action === "delete" ? "text-red-600 bg-red-100" :
                        "text-slate-600 bg-slate-100";

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm text-slate-500">
                            {new Date(log.timestamp).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {user ? user.username : `ID: ${log.userId}`}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${actionColor}`}>
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {log.targetType} (#{log.targetId})
                          </TableCell>
                          <TableCell>
                            {log.hopDongId ? (
                              <span className="inline-flex items-center text-blue-600 font-medium" title={`ID: ${log.hopDongId}`}>
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                {log.tenHopDong || `ID: ${log.hopDongId}`}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.details}
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
    </div>
  );
}
