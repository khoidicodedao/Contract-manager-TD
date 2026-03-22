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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Search, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import BorderGate from "@/components/modals/border_gate-modal";
import { BuocThucHien } from "@shared/schema";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface TiepNhan {
  id: number;
  hopDongId: number;
  tenHang: string;
  soToKhai?: string;
  soVanDon?: string;
  soPhieuDongGoi?: string;
  soHoaDon?: string;
  soBaoHiem?: string;
  diaDiemThongQuanId?: number;
  diaDiemThongQuanTuDo?: string;
  ngayThucHien: string;
  dieuKienGiaoHangId: number;
  trongLuong?: number;
  soKien?: number;
  giaTriHoaDon?: number;
  hinhThuc?: string;
  soGiayPhep?: string;
  thoiHanGiayPhep?: string;
  soHaiQuanDacBiet?: string;
  soThongBaoMienThue?: string;
  soBienBanBanGiao?: string;
  ngayBanGiao?: string;
  maHsCode?: string;
}

interface DiaDiemThongQuan {
  id: number;
  ten: string;
  chiCuc: string;
}

interface DieuKienGiaoHang {
  id: number;
  ten: string;
}

export default function Reception() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateBorderGateModalOpen, setIsCreateBorderGateModalOpen] = useState(false);
  const [selectedReceptionIds, setSelectedReceptionIds] = useState<number[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReception, setEditingReception] = useState<TiepNhan | null>(null);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receptions = [] } = useQuery<TiepNhan[]>({
    queryKey: ["/api/tiep-nhan"],
  });

  const { data: locations = [] } = useQuery<DiaDiemThongQuan[]>({
    queryKey: ["/api/dia-diem-thong-quan"],
  });

  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["/api/hop-dong"],
  });

  const { data: incoterms = [] } = useQuery<DieuKienGiaoHang[]>({
    queryKey: ["/api/dieu-kien-giao-hang"],
  });

  const { data: steps = [] } = useQuery<BuocThucHien[]>({
    queryKey: ["/api/buoc-thuc-hien"],
  });

  const handleExport = () => {
    const selectedData = receptions.filter((r) =>
      selectedReceptionIds.includes(r.id)
    );

    if (selectedData.length === 0) {
      toast({
        description: "Vui lòng chọn ít nhất một bản ghi để xuất Excel",
      });
      return;
    }

    const rows = selectedData.map((r) => {
      const contract = contracts.find((c) => c.id === r.hopDongId);
      return {
        "Số hợp đồng ngoại": contract?.soHdNgoai || "-",
        "Tên hợp đồng": contract?.ten || "-",
        "Hình thức": r.hinhThuc || "-",
        "Tên hàng": r.tenHang,
        "Số tờ khai": r.soToKhai || "-",
        "Số vận đơn": r.soVanDon || "-",
        "Số phiếu đóng gói": r.soPhieuDongGoi || "-",
        "Số hóa đơn": r.soHoaDon || "-",
        "Địa điểm thông quan": getLocationName(r),
        "Ngày thông quan": r.ngayThucHien ? new Date(r.ngayThucHien).toLocaleDateString() : "-",
        "Số giấy phép": r.soGiayPhep || "-",
        "Thời hạn giấy phép": r.thoiHanGiayPhep ? new Date(r.thoiHanGiayPhep).toLocaleDateString() : "-",
        "Hải quan đặc biệt": r.soHaiQuanDacBiet || "-",
        "Miễn thuế": r.soThongBaoMienThue || "-",
        "Biên bản bàn giao": r.soBienBanBanGiao || "-",
        "Ngày bàn giao": r.ngayBanGiao ? new Date(r.ngayBanGiao).toLocaleDateString() : "-",
        "HS Code": r.maHsCode || "-",
        "Trọng lượng": r.trongLuong || "-",
        "Số kiện": r.soKien || "-",
        "Giá trị hóa đơn": r.giaTriHoaDon || "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nhập Xuất");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buffer]), "nhap_xuat_export.xlsx");
  };

  const createMutation = useMutation({
    mutationFn: async (data: Omit<TiepNhan, "id">) => {
      await apiRequest("POST", "/api/tiep-nhan", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiep-nhan"] });
      setIsCreateOpen(false);
      toast({ description: "Đã tạo bản ghi thành công" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TiepNhan) => {
      await apiRequest("PUT", `/api/tiep-nhan/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiep-nhan"] });
      setIsEditOpen(false);
      setEditingReception(null);
      toast({ description: "Đã cập nhật bản ghi thành công" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tiep-nhan/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiep-nhan"] });
      toast({ description: "Đã xóa bản ghi thành công" });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const data = {
      hopDongId: parseInt(formData.get("hopDongId") as string),
      hinhThuc: formData.get("hinhThuc") as string,
      tenHang: formData.get("tenHang") as string,
      soToKhai: (formData.get("soToKhai") as string) || undefined,
      soVanDon: (formData.get("soVanDon") as string) || undefined,
      soPhieuDongGoi: (formData.get("soPhieuDongGoi") as string) || undefined,
      soHoaDon: (formData.get("soHoaDon") as string) || undefined,
      soBaoHiem: (formData.get("soBaoHiem") as string) || undefined,
      dieuKienGiaoHangId: parseInt(formData.get("dieuKienGiaoHangId") as string),
      diaDiemThongQuanId: useCustomLocation ? undefined : parseInt(formData.get("diaDiemThongQuanId") as string) || undefined,
      diaDiemThongQuanTuDo: useCustomLocation ? (formData.get("diaDiemThongQuanTuDo") as string) || undefined : undefined,
      ngayThucHien: formData.get("ngayThucHien") as string,
      trongLuong: formData.get("trongLuong") ? parseFloat(formData.get("trongLuong") as string) : undefined,
      soKien: formData.get("soKien") ? parseInt(formData.get("soKien") as string) : undefined,
      giaTriHoaDon: formData.get("giaTriHoaDon") ? parseFloat(formData.get("giaTriHoaDon") as string) : undefined,
      soGiayPhep: formData.get("soGiayPhep") as string || undefined,
      thoiHanGiayPhep: formData.get("thoiHanGiayPhep") as string || undefined,
      soHaiQuanDacBiet: formData.get("soHaiQuanDacBiet") as string || undefined,
      soThongBaoMienThue: formData.get("soThongBaoMienThue") as string || undefined,
      soBienBanBanGiao: formData.get("soBienBanBanGiao") as string || undefined,
      ngayBanGiao: formData.get("ngayBanGiao") as string || undefined,
      maHsCode: formData.get("maHsCode") as string || undefined,
    };

    if (editingReception) {
      updateMutation.mutate({ ...data, id: editingReception.id } as TiepNhan);
    } else {
      createMutation.mutate(data);
    }
  };

  const getContractNumber = (hopDongId: number) => {
    const contract = contracts.find((c) => c.id === hopDongId);
    return contract?.soHdNgoai || `Hợp đồng #${hopDongId}`;
  };

  const getLocationName = (reception: TiepNhan) => {
    if (reception.diaDiemThongQuanTuDo) return reception.diaDiemThongQuanTuDo;
    if (reception.diaDiemThongQuanId) {
      const location = locations.find((l) => l.id === reception.diaDiemThongQuanId);
      return location ? `${location.ten} - ${location.chiCuc}` : `Location #${reception.diaDiemThongQuanId}`;
    }
    return "Chưa xác định";
  };

  const openEditDialog = (reception: TiepNhan) => {
    setEditingReception(reception);
    setUseCustomLocation(!!reception.diaDiemThongQuanTuDo);
    setIsEditOpen(true);
  };

  const openCreateDialog = () => {
    setEditingReception(null);
    setUseCustomLocation(false);
    setIsCreateOpen(true);
  };

  const filteredReceptions = receptions.filter((reception) => {
    const contract = contracts.find((c) => c.id === reception.hopDongId);
    const searchLower = searchTerm.toLowerCase();
    return contract?.soHdNgoai?.toLowerCase().includes(searchLower) ||
      reception.tenHang?.toLowerCase().includes(searchLower);
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceptionIds(filteredReceptions.map(r => r.id));
    } else {
      setSelectedReceptionIds([]);
    }
  };

  const isAllSelected = filteredReceptions.length > 0 && selectedReceptionIds.length === filteredReceptions.length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Quản lý Nhập/Xuất"
          subtitle="Theo dõi thông tin thông quan, giấy phép và bàn giao hàng hóa"
          onCreateContract={() => { }}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Tìm theo số hợp đồng hoặc tên hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={openCreateDialog} className="bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Thêm bản ghi
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={selectedReceptionIds.length === 0}>
                <FileDown className="w-4 h-4 mr-2" /> Cấp file Excel ({selectedReceptionIds.length})
              </Button>
              <Button variant="ghost" onClick={() => setIsCreateBorderGateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Địa điểm thông quan
              </Button>
            </div>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg">Danh sách Nhập/Xuất</CardTitle>
              <CardDescription>Tổng cộng: {receptions.length} bản ghi</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100/50">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isAllSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </TableHead>
                    <TableHead>Hợp đồng</TableHead>
                    <TableHead>Hình thức</TableHead>
                    <TableHead>Tên hàng</TableHead>
                    <TableHead>Thông quan</TableHead>
                    <TableHead>HS Code</TableHead>
                    <TableHead>Số tờ khai</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Chưa có dữ liệu nhập/xuất
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReceptions.map((reception) => (
                      <TableRow key={reception.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedReceptionIds.includes(reception.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedReceptionIds(prev =>
                                checked ? [...prev, reception.id] : prev.filter(id => id !== reception.id)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {getContractNumber(reception.hopDongId)}
                        </TableCell>
                        <TableCell>
                          <Badge className={reception.hinhThuc === "Nhập" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}>
                            {reception.hinhThuc || "Chưa chọn"}
                          </Badge>
                        </TableCell>
                        <TableCell>{reception.tenHang}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div className="font-medium">{getLocationName(reception)}</div>
                            <div className="text-slate-500">{reception.ngayThucHien ? new Date(reception.ngayThucHien).toLocaleDateString() : "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{reception.maHsCode || "-"}</TableCell>
                        <TableCell>{reception.soToKhai || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEditDialog(reception)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => { if (confirm("Xóa bản ghi này?")) deleteMutation.mutate(reception.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>

        {/* Modal Form */}
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(val) => { if (!val) { setIsCreateOpen(false); setIsEditOpen(false); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReception ? "Chỉnh sửa Nhập/Xuất" : "Thêm mới Nhập/Xuất"}</DialogTitle>
              <DialogDescription>Cập nhật đầy đủ thông tin pháp lý, thông quan và bàn giao.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Section 1: Thông tin chung */}
                <div className="md:col-span-3 border-b pb-2">
                  <h3 className="font-semibold text-rose-600 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-rose-600 rounded-full" /> Thông tin chung & Hợp đồng
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label>Hợp đồng *</Label>
                  <Select name="hopDongId" defaultValue={editingReception?.hopDongId?.toString()} required>
                    <SelectTrigger><SelectValue placeholder="Chọn hợp đồng" /></SelectTrigger>
                    <SelectContent>
                      {contracts.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.soHdNgoai} - {c.ten}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hình thức *</Label>
                  <Select name="hinhThuc" defaultValue={editingReception?.hinhThuc || "Nhập"} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nhập">Nhập khẩu</SelectItem>
                      <SelectItem value="Xuất">Xuất khẩu</SelectItem>
                      <SelectItem value="Tạm nhập tái xuất">Tạm nhập </SelectItem>
                      <SelectItem value="Tạm xuất tái nhập">Tạm xuất</SelectItem>
                      <SelectItem value="Gia công">Tái nhập</SelectItem>

                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tên hàng hóa *</Label>
                  <Input name="tenHang" defaultValue={editingReception?.tenHang} required placeholder="Tên thiết bị/phụ tùng..." />
                </div>

                {/* Section 2: Thông quan */}
                <div className="md:col-span-3 border-b pb-2 pt-4">
                  <h3 className="font-semibold text-rose-600 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-rose-600 rounded-full" /> Thông tin Thông quan & Tờ khai
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label>Số tờ khai</Label>
                  <Input name="soToKhai" defaultValue={editingReception?.soToKhai} placeholder="Ví dụ: 1054..." />
                </div>
                <div className="space-y-2">
                  <Label>Số vận đơn (B/L)</Label>
                  <Input name="soVanDon" defaultValue={editingReception?.soVanDon} />
                </div>
                <div className="space-y-2">
                  <Label>Số hóa đơn (Invoice)</Label>
                  <Input name="soHoaDon" defaultValue={editingReception?.soHoaDon} />
                </div>

                <div className="space-y-2">
                  <Label>Địa điểm thông quan</Label>
                  <Select
                    name="diaDiemThongQuanId"
                    defaultValue={editingReception?.diaDiemThongQuanId?.toString()}
                    onValueChange={(val) => setUseCustomLocation(val === "custom")}
                  >
                    <SelectTrigger><SelectValue placeholder="Chọn địa điểm" /></SelectTrigger>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.ten}</SelectItem>)}
                      <SelectItem value="custom">-- Khác (Tự nhập) --</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {useCustomLocation && (
                  <div className="space-y-2">
                    <Label>Tên địa điểm khác</Label>
                    <Input name="diaDiemThongQuanTuDo" defaultValue={editingReception?.diaDiemThongQuanTuDo} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Ngày thông quan</Label>
                  <Input type="date" name="ngayThucHien" defaultValue={editingReception?.ngayThucHien} required />
                </div>

                <div className="space-y-2">
                  <Label>HS Code</Label>
                  <Input name="maHsCode" defaultValue={editingReception?.maHsCode} placeholder="8471..." />
                </div>

                {/* Section 3: Giấy phép & Đặc biệt */}
                <div className="md:col-span-3 border-b pb-2 pt-4">
                  <h3 className="font-semibold text-rose-600 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-rose-600 rounded-full" /> Giấy phép & Quy định đặc biệt
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label>Số giấy phép</Label>
                  <Input name="soGiayPhep" defaultValue={editingReception?.soGiayPhep} />
                </div>
                <div className="space-y-2">
                  <Label>Thời hạn giấy phép</Label>
                  <Input type="date" name="thoiHanGiayPhep" defaultValue={editingReception?.thoiHanGiayPhep} />
                </div>
                <div className="space-y-2">
                  <Label>Số Hải quan đặc biệt</Label>
                  <Input name="soHaiQuanDacBiet" defaultValue={editingReception?.soHaiQuanDacBiet} />
                </div>
                <div className="space-y-2">
                  <Label>Thông báo miễn thuế</Label>
                  <Input name="soThongBaoMienThue" defaultValue={editingReception?.soThongBaoMienThue} />
                </div>

                {/* Section 4: Bàn giao */}
                <div className="md:col-span-3 border-b pb-2 pt-4">
                  <h3 className="font-semibold text-rose-600 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-rose-600 rounded-full" /> Hồ sơ bàn giao
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label>Số biên bản bàn giao</Label>
                  <Input name="soBienBanBanGiao" defaultValue={editingReception?.soBienBanBanGiao} />
                </div>
                <div className="space-y-2">
                  <Label>Ngày bàn giao</Label>
                  <Input type="date" name="ngayBanGiao" defaultValue={editingReception?.ngayBanGiao} />
                </div>

                <div className="space-y-2">
                  <Label>Điều kiện giao hàng</Label>
                  <Select name="dieuKienGiaoHangId" defaultValue={editingReception?.dieuKienGiaoHangId?.toString()} required>
                    <SelectTrigger><SelectValue placeholder="Chọn Incoterm" /></SelectTrigger>
                    <SelectContent>
                      {incoterms.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.ten}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-6">
                <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
                  Đóng
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
                  {editingReception ? "Cập nhật thay đổi" : "Lưu bản ghi mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <BorderGate
          isOpen={isCreateBorderGateModalOpen}
          onClose={() => setIsCreateBorderGateModalOpen(false)}
        />
      </div>
    </div>
  );
}
