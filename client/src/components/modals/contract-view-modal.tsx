import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HopDong,
  BuocThucHien,
  FileHopDong,
  insertBuocThucHienSchema,
  InsertBuocThucHien,
  insertFileHopDongSchema,
  InsertFileHopDong,
  CanBo,
  ThanhToan,
  TiepNhan,
  LoaiTien,
  LoaiThanhToan,
  LoaiHinhThucThanhToan,
  LoaiHopDong,
  NhaCungCap,
  ChuDauTu,
  LoaiNganSach,
} from "@shared/schema";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  PROGRESS_STATUS_COLORS,
} from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Folder,
  FileText,
  Plus,
  CreditCard,
  Download,
  Eye,
  Upload,
  X,
  Package,
  Shield,
  Stamp,
  DollarSign,
} from "lucide-react";

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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import ContractProgressTimeline from "./constract-timline";
import { CapTienTimeline } from "./captien-timeline";
import { File as FileIconBase, FileSpreadsheet } from "lucide-react";

// ⬇️ THÊM vào import constants (nếu chưa có)
import { FILE_TYPE_LABELS } from "@/lib/constants";

// ⬇️ THÊM (nếu cần dùng cleanup effect cho blob URL)
import { useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
interface ContractViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: HopDong;
}
import { ProgressTimeline } from "./progress-timeline";
export default function ContractViewModal({
  isOpen,
  onClose,
  contract,
}: ContractViewModalProps) {
  // ⬇️ THÊM
  const formatFileSize = (sizeInBytes: number | null | undefined) => {
    if (!sizeInBytes) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let size = sizeInBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  };

  const getFileTypeLabel = (
    fileName: string | null | undefined,
    loaiFile?: string | null
  ) => {
    const name = fileName ?? "";
    const hasDot = name.includes(".");
    const ext = hasDot ? "." + name.split(".").pop()!.toLowerCase() : "";
    if (ext) {
      return FILE_TYPE_LABELS[ext as keyof typeof FILE_TYPE_LABELS] || "Khác";
    }
    if (loaiFile) {
      const lf = loaiFile.toLowerCase();
      if (lf.includes("pdf")) return "PDF";
      if (lf.includes("word") || lf.includes("doc")) return "Word";
      if (lf.includes("excel") || lf.includes("xls") || lf.includes("sheet"))
        return "Excel";
    }
    return "Khác";
  };

  const getFileIcon = (fileType: string | null | undefined) => {
    if (!fileType) return FileIconBase;
    const type = fileType.toLowerCase();
    if (type.includes("pdf")) return FileText;
    if (type.includes("doc")) return FileText;
    if (
      type.includes("xls") ||
      type.includes("sheet") ||
      type.includes("excel")
    )
      return FileSpreadsheet;
    return FileIconBase;
  };
  // ⬇️ THÊM
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<FileHopDong | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // ⬇️ THÊM – mở modal xem trước
  const handleOpenViewer = async (doc: FileHopDong) => {
    setViewingDoc(doc);
    setIsViewerOpen(true);

    try {
      // 1) data URL có sẵn
      if (doc.noiDungFile && doc.noiDungFile.startsWith("data:")) {
        setPreviewUrl(doc.noiDungFile);
        return;
      }
      // 2) duongDan tuyệt đối
      if (doc.duongDan && /^https?:\/\//i.test(doc.duongDan)) {
        const resp = await fetch(doc.duongDan);
        if (!resp.ok) throw new Error("Không thể tải file để xem");
        const blob = await resp.blob();
        setPreviewUrl(URL.createObjectURL(blob));
        return;
      }
      // 3) tải qua API
      const response = await fetch(`/api/file-hop-dong/${doc.id}/download`);
      if (!response.ok) throw new Error("Không thể tải file để xem");
      const blob = await response.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      toast({
        title: "Lỗi",
        description: "Không thể mở xem tài liệu",
        variant: "destructive",
      });
      setIsViewerOpen(false);
      setViewingDoc(null);
      setPreviewUrl(null);
    }
  };

  // ⬇️ THÊM – tải xuống (đúng logic như trang Documents)
  const handleDownloadDocument = async (docObj: FileHopDong) => {
    try {
      // data URL
      if (docObj.noiDungFile && docObj.noiDungFile.startsWith("data:")) {
        const link = window.document.createElement("a");
        link.href = docObj.noiDungFile;
        link.download = docObj.tenFile || "document";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        toast({
          title: "Thành công",
          description: "Tài liệu đã được tải xuống",
        });
        return;
      }
      // URL tuyệt đối
      if (docObj.duongDan && /^https?:\/\//i.test(docObj.duongDan)) {
        const resp = await fetch(docObj.duongDan);
        if (!resp.ok) throw new Error("Không thể tải file từ đường dẫn");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.download = docObj.tenFile || "document";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast({
          title: "Thành công",
          description: "Tài liệu đã được tải xuống",
        });
        return;
      }
      // fallback: API download
      const response = await fetch(
        `/api/file-hop-dong/${docObj.id}/download`
      );
      if (!response.ok) throw new Error("Không thể tải file");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = docObj.tenFile || "document";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Thành công", description: "Tài liệu đã được tải xuống" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải xuống tài liệu",
        variant: "destructive",
      });
    }
  };

  // ⬇️ THÊM – cleanup blob URL khi đóng/huỷ
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<FileHopDong | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: progressSteps = [] } = useQuery<BuocThucHien[]>({
    queryKey: ["/api/buoc-thuc-hien"],
    enabled: isOpen && !!contract,
  });

  const { data: contractFiles = [] } = useQuery<FileHopDong[]>({
    queryKey: ["/api/file-hop-dong"],
    enabled: isOpen && !!contract,
  });

  const { data: staffList = [] } = useQuery<CanBo[]>({
    queryKey: ["/api/can-bo"],
    enabled: isAddingFile,
  });

  const { data: payments = [] } = useQuery<ThanhToan[]>({
    queryKey: ["/api/thanh-toan"],
    enabled: isOpen && !!contract,
  });

  const { data: repceptions = [] } = useQuery<TiepNhan[]>({
    queryKey: ["/api/tiep-nhan"],
    enabled: isOpen && !!contract,
  });

  const { data: loaiTien = [] } = useQuery<LoaiTien[]>({
    queryKey: ["/api/loai-tien"],
    enabled: isOpen && !!contract,
  });

  const { data: loaiThanhToan = [] } = useQuery<LoaiThanhToan[]>({
    queryKey: ["/api/loai-thanh-toan"],
    enabled: isOpen && !!contract,
  });

  const { data: loaiHinhThucThanhToan = [] } = useQuery<LoaiHinhThucThanhToan[]>({
    queryKey: ["/api/loai-hinh-thuc-thanh-toan"],
    enabled: isOpen && !!contract,
  });

  const { data: loaiHopDong = [] } = useQuery<LoaiHopDong[]>({
    queryKey: ["/api/loai-hop-dong"],
    enabled: isOpen && !!contract,
  });

  const { data: nhaCungCap = [] } = useQuery<NhaCungCap[]>({
    queryKey: ["/api/nha-cung-cap"],
    enabled: isOpen && !!contract,
  });

  const { data: chuDauTu = [] } = useQuery<ChuDauTu[]>({
    queryKey: ["/api/chu-dau-tu"],
    enabled: isOpen && !!contract,
  });

  const { data: canBo = [] } = useQuery<CanBo[]>({
    queryKey: ["/api/can-bo"],
    enabled: isOpen && !!contract,
  });

  const { data: loaiNganSach = [] } = useQuery<LoaiNganSach[]>({
    queryKey: ["/api/loai-ngan-sach"],
    enabled: isOpen && !!contract,
  });

  const { data: allBaoLanh = [] } = useQuery<any[]>({
    queryKey: ["/api/bao-lanh"],
    enabled: isOpen && !!contract,
  });

  const { data: lcList = [] } = useQuery<any[]>({
    queryKey: ["/api/thu-tin-dung"],
    enabled: isOpen && !!contract,
  });

  const { data: costTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/loai-chi-phi"],
    enabled: isOpen && !!contract,
  });

  const { data: actualCosts = [] } = useQuery<any[]>({
    queryKey: ["/api/chi-phi-thuc-te"],
    enabled: isOpen && !!contract,
  });

  const { data: plannedCosts = [] } = useQuery<any[]>({
    queryKey: ["/api/chi-phi-theo-hop-dong"],
    enabled: isOpen && !!contract,
  });

  const { data: allThuTinDung = [] } = useQuery<any[]>({
    queryKey: ["/api/thu-tin-dung"],
    enabled: isOpen && !!contract,
  });

  const { data: loaiBaoLanh = [] } = useQuery<any[]>({
    queryKey: ["/api/loai-bao-lanh"],
    enabled: isOpen && !!contract,
  });

  // Filters and calculations
  const contractProgressSteps = progressSteps.filter(
    (step) => step.hopDongId === contract.id
  );
  const contractPayments = payments
    .filter((payment: any) => payment.hopDongId === contract.id)
    .map((payment: any) => {
      const now = new Date();
      const hanThucHien = payment.hanThucHien
        ? new Date(payment.hanThucHien)
        : null;
      const hanHopDong = payment.hanHopDong
        ? new Date(payment.hanHopDong)
        : null;
      const deadline = hanThucHien || hanHopDong;
      const isOverdue = deadline && !payment.daThanhToan && deadline < now;

      return {
        ...payment,
        isOverdue,
      };
    });

  const contractFileList = contractFiles.filter(
    (file) => file.hopDongId === contract.id
  );

  const reception = repceptions.filter(
    (reception: any) => reception.hopDongId === contract.id
  );

  const contractBaoLanh = allBaoLanh.filter(
    (item: any) => item.hopDongId === contract.id
  );

  const contractThuTinDung = allThuTinDung.filter(
    (item: any) => item.hopDongId === contract.id
  );

  // File Upload Form
  const fileForm = useForm<InsertFileHopDong>({
    resolver: zodResolver(insertFileHopDongSchema),
    defaultValues: {
      hopDongId: contract?.id,
      tenFile: "",
      ghiChu: "",
      ngayTaiLen: new Date().toISOString().split("T")[0],
      nguoiTaiLen: undefined,
    },
  });

  const createFileMutation = useMutation({
    mutationFn: async (data: InsertFileHopDong) => {
      return await apiRequest("POST", "/api/file-hop-dong", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/file-hop-dong"] });
      toast({
        title: "Thành công",
        description: "Tài liệu đã được tải lên",
      });
      fileForm.reset();
      setSelectedFile(null);
      setIsAddingFile(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tải lên tài liệu",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!fileForm.getValues("tenFile")) {
        fileForm.setValue("tenFile", file.name);
      }
    }
  };

  const handleFileUpload = async (data: InsertFileHopDong) => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        createFileMutation.mutate({
          ...data,
          noiDungFile: base64String,
          kichThuoc: selectedFile.size,
          loaiFile: selectedFile.type,
        });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      createFileMutation.mutate(data);
    }
  };

  const form = useForm<InsertBuocThucHien>({
    resolver: zodResolver(insertBuocThucHienSchema),
    defaultValues: {
      hopDongId: contract?.id,
      ten: "",
      moTa: "",
      ngayBatDau: new Date().toISOString().split("T")[0],
      ngayKetThuc: "",
      trangThai: "Chờ thực hiện",
      thuTu: (contractProgressSteps?.length || 0) + 1,
    },
  });

  const createProgressMutation = useMutation({
    mutationFn: async (data: InsertBuocThucHien) => {
      return await apiRequest("POST", "/api/buoc-thuc-hien", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buoc-thuc-hien"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/overview"] });
      toast({
        title: "Thành công",
        description: "Bước thực hiện đã được thêm",
      });
      form.reset({
        hopDongId: contract?.id,
        ten: "",
        moTa: "",
        ngayBatDau: new Date().toISOString().split("T")[0],
        ngayKetThuc: "",
        trangThai: "Chờ thực hiện",
        thuTu: (contractProgressSteps?.length || 0) + 2,
      });
      setIsAddingProgress(false);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm bước thực hiện",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (statusId: number | null) => {
    if (!statusId) return null;

    const label =
      CONTRACT_STATUS_LABELS[statusId as keyof typeof CONTRACT_STATUS_LABELS] ||
      "Không xác định";
    const color =
      CONTRACT_STATUS_COLORS[statusId as keyof typeof CONTRACT_STATUS_COLORS] ||
      "bg-gray-100 text-gray-800";

    return <Badge className={color}>{label}</Badge>;
  };

  const getProgressPercentage = (step: BuocThucHien) => {
    if (!step.ngayBatDau || !step.ngayKetThuc) return 0;

    const start = new Date(step.ngayBatDau).getTime();
    const end = new Date(step.ngayKetThuc).getTime();
    const now = Date.now();

    if (step.trangThai === "Hoàn thành") return 100;
    if (step.trangThai === "Chờ thực hiện") return 0;

    const progress = ((now - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getProgressStatusIcon = (status: string | null) => {
    if (!status) return Clock;

    switch (status.toLowerCase()) {
      case "hoàn thành":
        return CheckSquare;
      case "đang thực hiện":
        return Clock;
      case "tạm dừng":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getProgressStatusColor = (status: string | null) => {
    if (!status) return "text-gray-500";

    switch (status.toLowerCase()) {
      case "hoàn thành":
        return "text-green-600";
      case "đang thực hiện":
        return "text-blue-600";
      case "tạm dừng":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const getCurrencyName = (currencyId?: string | number | null) => {
    if (currencyId === undefined || currencyId === null) return "VND";
    const idNum = typeof currencyId === "string" ? parseInt(currencyId) : currencyId;
    const currency = (loaiTien as any[]).find((item: any) => item.id === idNum);
    return currency?.ten || "VND";
  };

  const getPaymentTypeName = (typeId: number | null) => {
    const type = (loaiThanhToan as any[]).find((item: any) => item.id === typeId);
    return type?.ten || "Chưa xác định";
  };

  const contractActualCosts = actualCosts.filter((c: any) => c.hopDongId === contract.id);
  const contractPlannedCosts = plannedCosts.filter((c: any) => c.hopDongId === contract.id);

  const exportCosts = (type: "actual" | "planned") => {
    const data = type === "actual" ? contractActualCosts : contractPlannedCosts;
    const title = type === "actual" ? "Chi phí thực tế" : "Chi phí theo hợp đồng";

    const rows = data.map((c: any) => {
      const costType = costTypes.find((t: any) => t.id === c.loaiChiPhiId);
      return {
        "Hợp đồng": `${contract.soHdNgoai || contract.soHdNoi} - ${contract.ten}`,
        "Loại chi phí": costType?.tenLoai || "-",
        "Ngày thực hiện": c.ngayThucHien ? new Date(c.ngayThucHien).toLocaleDateString("vi-VN") : "-",
        "Trị giá": c.triGia,
        "Ghi chú": c.ghiChu,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `chi_phi_${type === "actual" ? "thuc_te" : "theo_hd"}_${contract.soHdNgoai || contract.id}.xlsx`);
  };

  const getPaymentMethodName = (methodId: number | null) => {
    const method = (loaiHinhThucThanhToan as any[]).find(
      (item: any) => item.id === methodId
    );
    return method?.ten || "Chưa xác định";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Chi tiết hợp đồng: {contract?.ten}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="info">Theo dõi</TabsTrigger>
            <TabsTrigger value="payments">Tài chính</TabsTrigger>
            <TabsTrigger value="costs">Chi phí</TabsTrigger>
            <TabsTrigger value="bao-lanh">Bảo lãnh</TabsTrigger>
            <TabsTrigger value="thu-tin-dung">L/C</TabsTrigger>
            <TabsTrigger value="files">Tài liệu</TabsTrigger>
            <TabsTrigger value="reception">Nhập/Xuất</TabsTrigger>
          </TabsList>

          {/* Contract Info Tab */}
          <TabsContent value="info" className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Tên hợp đồng
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {contract.ten || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Trạng thái
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(contract.trangThaiHopDongId)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Giá trị hợp đồng
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {contract.giaTriHopDong || "-"}{" "}
                    {/* {getCurrencyName(contract.loaiTienId)} */}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Số HĐ ngoài
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {contract.soHdNgoai || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Ngày ký
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(contract.ngay)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Phí ủy thác
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {(
                      Number(contract?.phiUyThac || 1) *
                      Number(contract?.tyGia || 1)
                    ).toLocaleString("vi-VN")}{" "}
                    VND
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Loại ngân sách
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {(loaiNganSach as any[]).find(
                      (item: any) => item.id === contract.loaiNganSachId
                    )?.ten || "Chưa xác định"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Loại tiền
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getCurrencyName(contract.loaiTienId)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Tỷ giá
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {contract.tyGia || "1"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Thuế nhà thầu
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {contract.thueNhaThau || "0"} %
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {contract.moTa && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Mô tả hợp đồng</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {contract.moTa}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  <span>Thông tin ngân sách & Chi phí</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Tổng hạn mức ngân sách</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(contract.tongHanMucNganSach || 0)} {contract.loaiTienTongHanMuc || "VNĐ"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">Chi phí đoàn ra, đoàn vào</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(contract.chiPhiDoanRaDoanVao || 0)} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Chi phí thực hiện trong nước</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(contract.chiPhiThucHienTrongNuoc || 0)} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Liquidation & Handover */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <span className="w-1 h-4 bg-purple-600 rounded-full"></span>
                  <span>Thanh lý & Bàn giao</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="pb-2 border-b border-slate-50">
                    <span className="text-xs text-slate-400 block mb-1">Số & Ngày biên bản thanh lý</span>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-900">{contract.soBienBanThanhLy || "-"}</span>
                      <span className="text-sm text-slate-500">{formatDate(contract.ngayBienBanThanhLy)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Số & Ngày biên bản bàn giao đồng bộ</span>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-900">{contract.soBienBanBanGiaoDongBo || "-"}</span>
                      <span className="text-sm text-slate-500">{formatDate(contract.ngayBienBanBanGiaoDongBo)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Progress Tree */}
            <ProgressTimeline
              contractProgressSteps={contractProgressSteps.map(step => ({
                ...step,
                id: step.id.toString(),
                canBoPhuTrachId: step.canBoPhuTrachId?.toString(),
                loaiTienId: step.loaiTienId?.toString()
              })) as any}
              canBo={(canBo as any[]).map(cb => ({
                ...cb,
                id: cb.id.toString()
              })) as any}
              getLoaiTien={getCurrencyName as any}
            />

            <Separator />

            {/* Payment Information */}

            {/* Related Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Thông tin liên quan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Loại hợp đồng
                  </label>
                  <p className="mt-1 text-sm text-gray-900 bg-blue-50 p-2 rounded border">
                    {loaiHopDong.find(
                      (item: any) => item.id === contract.loaiHopDongId
                    )?.ten || "Chưa xác định"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Chủ đầu tư
                  </label>
                  <div className="mt-1 bg-green-50 p-3 rounded border">
                    <p className="text-sm font-medium text-gray-900">
                      {chuDauTu.find(
                        (item: any) => item.id === contract.chuDauTuId
                      )?.ten || "Chưa xác định"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {chuDauTu.find(
                        (item: any) => item.id === contract.chuDauTuId
                      )?.diaChi || ""}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Nhà cung cấp
                  </label>
                  <div className="mt-1 bg-purple-50 p-3 rounded border">
                    <p className="text-sm font-medium text-gray-900">
                      {nhaCungCap.find(
                        (item: any) => item.id === contract.nhaCungCapId
                      )?.ten || "Chưa xác định"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {nhaCungCap.find(
                        (item: any) => item.id === contract.nhaCungCapId
                      )?.diaChi || ""}
                    </p>
                    {/* {nhaCungCap.find(
                      (item: any) => item.id === contract.nhaCungCapId
                    )?.soDienThoai && (
                      <p className="text-xs text-gray-600">
                        SĐT:{" "}
                        {
                          nhaCungCap.find(
                            (item: any) => item.id === contract.nhaCungCapId
                          )?.soDienThoai
                        }
                      </p>
                    )} */}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Loại ngân sách
                  </label>
                  <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-2 rounded border">
                    {loaiNganSach.find(
                      (item: any) => item.id === contract.loaiNganSachId
                    )?.ten || "Chưa xác định"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">
                    Cán bộ phụ trách
                  </label>
                  <div className="mt-1 bg-indigo-50 p-3 rounded border">
                    {(() => {
                      const staff = canBo.find(
                        (item: any) => item.id === contract.canBoId
                      );
                      if (!staff) return null;
                      return (
                        <>
                          {staff.anh && (
                            <div className="mb-2">
                              <img
                                src={`${staff.anh}`}
                                alt="Ảnh cán bộ"
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            </div>
                          )}
                          <p className="text-sm font-medium text-gray-900">
                            {staff.ten || "Chưa xác định"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Chức vụ: {staff.chucVu || ""}
                          </p>
                          <div className="mt-1">
                            {staff.trangThai === "Đang làm việc" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
                                Đang làm việc
                              </span>
                            )}
                            {staff.trangThai === "Đã phục viên" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800">
                                Đã phục viên
                              </span>
                            )}
                            {staff.trangThai === "Chuyển phòng" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800">
                                Chuyển phòng
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab */}

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Thông tin thanh toán</h3>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600">Tổng thanh toán</p>
                    <p className="text-xl font-bold text-blue-900">
                      {contractPayments.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckSquare className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600">Đã thanh toán</p>
                    <p className="text-xl font-bold text-green-900">
                      {contractPayments.filter((p) => p.daThanhToan).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm text-red-600">Chưa thanh toán</p>
                    <p className="text-xl font-bold text-red-900">
                      {contractPayments.filter((p) => !p.daThanhToan).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              {contractPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Chưa có thông tin thanh toán</p>
                </div>
              ) : (
                contractPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${payment.daThanhToan ? "bg-green-500" : "bg-red-500"
                            }`}
                        ></div>
                        <h4 className="font-medium">
                          {formatCurrency(payment.soTien || 0)}{" "}
                          {getCurrencyName(payment.loaiTienId)}
                        </h4>
                      </div>
                      <Badge
                        variant={
                          payment.daThanhToan ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {payment.daThanhToan
                          ? "Đã Thanh Toán"
                          : "Chưa Thanh Toán"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Loại thanh toán:</span>{" "}
                        {getPaymentTypeName(payment.loaiThanhToanId)}
                      </div>
                      <div>
                        <span className="font-medium">Hình thức:</span>{" "}
                        {getPaymentMethodName(payment.loaiHinhThucThanhToanId)}
                      </div>
                      <div>
                        <span className="font-medium">Hạn thực hiện:</span>{" "}
                        {formatDate(payment.hanThucHien)}
                      </div>
                    </div>

                    {payment.ghiChu && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Ghi chú:</span>{" "}
                        {payment.ghiChu}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <CapTienTimeline
              getLoaiTien={getCurrencyName as any}
              contractId={contract.id}
            />
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-red-600" />
                  Chi phí thực tế
                </h3>
                <Button variant="outline" size="sm" onClick={() => exportCosts("actual")}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Excel
                </Button>
              </div>

              {contractActualCosts.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Chưa có chi phí thực tế</p>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại chi phí</TableHead>
                        <TableHead>Ngày thực hiện</TableHead>
                        <TableHead>Trị giá</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractActualCosts.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {costTypes.find((t: any) => t.id === c.loaiChiPhiId)?.tenLoai || "-"}
                          </TableCell>
                          <TableCell>{c.ngayThucHien ? new Date(c.ngayThucHien).toLocaleDateString("vi-VN") : "-"}</TableCell>
                          <TableCell className="font-semibold text-red-600">{c.triGia?.toLocaleString()}</TableCell>
                          <TableCell className="text-slate-500">{c.ghiChu || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
                  Chi phí theo hợp đồng
                </h3>
                <Button variant="outline" size="sm" onClick={() => exportCosts("planned")}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Excel
                </Button>
              </div>

              {contractPlannedCosts.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Chưa có chi phí theo hợp đồng</p>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại chi phí</TableHead>
                        <TableHead>Ngày thực hiện</TableHead>
                        <TableHead>Trị giá</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractPlannedCosts.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {costTypes.find((t: any) => t.id === c.loaiChiPhiId)?.tenLoai || "-"}
                          </TableCell>
                          <TableCell>{c.ngayThucHien ? new Date(c.ngayThucHien).toLocaleDateString("vi-VN") : "-"}</TableCell>
                          <TableCell className="font-semibold text-primary">{c.triGia?.toLocaleString()}</TableCell>
                          <TableCell className="text-slate-500">{c.ghiChu || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bao Lanh Tab */}
          <TabsContent value="bao-lanh" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bảo lãnh hợp đồng</h3>
            </div>

            {contractBaoLanh.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Chưa có thông tin bảo lãnh</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contractBaoLanh.map((item: any) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold text-slate-900">
                          {item.soBaoLanh}
                        </h4>
                      </div>
                      <Badge variant="outline">
                        {loaiBaoLanh.find((l: any) => l.id === item.loaiBaoLanhId)
                          ?.tenLoai || "Bảo lãnh"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-slate-500">
                          Trị giá:
                        </span>{" "}
                        {formatCurrency(item.triGia || 0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Tỷ lệ:</span>{" "}
                        {item.tyLe}%
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">
                          Ngày cấp:
                        </span>{" "}
                        {formatDate(item.ngayCap)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">
                          Thời hạn:
                        </span>{" "}
                        {formatDate(item.thoiHan)}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-slate-500">
                          Người thụ hưởng:
                        </span>{" "}
                        {item.nguoiThuHuong}
                      </div>
                    </div>

                    {item.fileScan && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(item.fileScan, "_blank")
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Xem văn bản bảo lãnh
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Thu Tin Dung Tab */}
          <TabsContent value="thu-tin-dung" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Thư tín dụng (L/C)</h3>
            </div>

            {contractThuTinDung.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Stamp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Chưa có thông tin thư tín dụng</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contractThuTinDung.map((item: any) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Stamp className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold text-slate-900">
                          L/C số: {item.soLc}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 italic">
                        Ngày mở: {formatDate(item.ngayMo)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium text-slate-500">
                          Trị giá:
                        </span>{" "}
                        {formatCurrency(item.triGia || 0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Tỷ giá:</span>{" "}
                        {item.tyGia}
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">
                          Thời hạn:
                        </span>{" "}
                        {formatDate(item.thoiHan)}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-slate-500">
                          Người thụ hưởng:
                        </span>{" "}
                        {item.nguoiThuHuong}
                      </div>
                    </div>

                    {item.fileScan && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(item.fileScan, "_blank")
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Xem văn bản L/C
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tài liệu hợp đồng</h3>
              {/* <Button
                onClick={() => setIsAddingFile(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm tài liệu
              </Button> */}
            </div>

            {/* File Upload Form */}
            {isAddingFile && (
              <Card className="p-4 border-blue-200 bg-blue-50">
                <Form {...fileForm}>
                  <form
                    onSubmit={fileForm.handleSubmit(handleFileUpload)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={fileForm.control}
                        name="tenFile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên file</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Tên file sẽ tự động điền"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fileForm.control}
                        name="nguoiTaiLen"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Người tải lên</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn người tải lên" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {staffList.map((staff: any) => (
                                  <SelectItem
                                    key={staff.id}
                                    value={staff.id.toString()}
                                  >
                                    {staff.ten} - {staff.chucVu}
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
                      control={fileForm.control}
                      name="ghiChu"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ghi chú</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="Mô tả về tài liệu..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chọn file</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer"
                          >
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                {selectedFile ? selectedFile.name : "Chọn file"}
                              </span>
                            </Button>
                          </label>
                          {selectedFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="ml-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, XLS, PNG, JPG. Tối đa 10MB cho tài liệu, 5MB
                        cho hình ảnh
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddingFile(false);
                          setSelectedFile(null);
                          fileForm.reset();
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={createFileMutation.isPending || !selectedFile}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createFileMutation.isPending
                          ? "Đang tải lên..."
                          : "Tải lên"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            )}

            {/* Files List */}
            <div className="space-y-2">
              {contractFileList.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Chưa có tài liệu nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên file</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Ngày tải</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractFileList.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          {file.tenFile}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {file.loaiFile?.includes("image/")
                              ? "Hình ảnh"
                              : file.loaiFile?.includes("pdf")
                                ? "PDF"
                                : file.loaiFile?.includes("word") ||
                                  file.loaiFile?.includes("document")
                                  ? "Word"
                                  : file.loaiFile?.includes("sheet") ||
                                    file.loaiFile?.includes("excel")
                                    ? "Excel"
                                    : "File"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {file.kichThuoc
                            ? `${(file.kichThuoc / 1024 / 1024).toFixed(2)} MB`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {file.ngayTaiLen
                            ? format(new Date(file.ngayTaiLen), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenViewer(file)} // ⬅️ THAY vì setSelectedFile(file)
                              title="Xem tài liệu"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadDocument(file)} // ⬅️ GỌI hàm mới
                              title="Tải xuống"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Reception Tab */}
          <TabsContent value="reception" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nhập/Xuất</h3>
            </div>

            {reception.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>Chưa có dữ liệu Nhập/Xuất</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reception.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <h4 className="font-medium text-slate-800">
                          {item.tenHang}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500">
                        Ngày thực hiện: {formatDate(item.ngayThucHien)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-600">
                      <div><span className="font-medium text-slate-500">Hình thức:</span> <Badge variant="outline">{item.hinhThuc || "—"}</Badge></div>
                      <div><span className="font-medium text-slate-500">Số tờ khai:</span> {item.soToKhai || "—"}</div>
                      <div><span className="font-medium text-slate-500">Số vận đơn:</span> {item.soVanDon || "—"}</div>
                      <div><span className="font-medium text-slate-500">Số phiếu đóng gói:</span> {item.soPhieuDongGoi || "—"}</div>
                      <div><span className="font-medium text-slate-500">Số hóa đơn:</span> {item.soHoaDon || "—"}</div>
                      <div><span className="font-medium text-slate-500">Số bảo hiểm:</span> {item.soBaoHiem || "—"}</div>
                      <div><span className="font-medium text-slate-500">Mã HS Code:</span> {item.maHsCode || "—"}</div>
                      <div><span className="font-medium text-slate-500">Địa điểm thông quan:</span> {item.diaDiemThongQuanTuDo || (item.diaDiemThongQuanId ? `Mã ${item.diaDiemThongQuanId}` : "—")}</div>
                      <div><span className="font-medium text-slate-500">Số giấy phép:</span> {item.soGiayPhep || "—"}</div>
                      <div><span className="font-medium text-slate-500">Thời hạn giấy phép:</span> {formatDate(item.thoiHanGiayPhep)}</div>
                      <div><span className="font-medium text-slate-500">Hải quan đặc biệt:</span> {item.soHaiQuanDacBiet || "—"}</div>
                      <div><span className="font-medium text-slate-500">Thông báo miễn thuế:</span> {item.soThongBaoMienThue || "—"}</div>
                      <div><span className="font-medium text-slate-500">Biên bản bàn giao:</span> {item.soBienBanBanGiao || "—"}</div>
                      <div><span className="font-medium text-slate-500">Ngày bàn giao:</span> {formatDate(item.ngayBanGiao)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
      <Dialog
        open={isViewerOpen}
        onOpenChange={(open) => {
          setIsViewerOpen(open);
          if (!open) {
            setViewingDoc(null);
            if (previewUrl?.startsWith("blob:"))
              URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Xem tài liệu</span>
              {viewingDoc?.tenFile && (
                <span className="text-sm font-normal text-slate-500 truncate ml-2">
                  {viewingDoc.tenFile}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {!viewingDoc ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Không có tài liệu để hiển thị
            </div>
          ) : (
            (() => {
              const label = getFileTypeLabel(
                viewingDoc.tenFile,
                viewingDoc.loaiFile
              );
              const type = (viewingDoc.loaiFile || "").toLowerCase();

              if (label === "Word" || label === "Excel") {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <FileText className="w-10 h-10 text-slate-400" />
                    <p className="text-slate-600">
                      Loại tệp <b>{label}</b> không hỗ trợ xem trực tiếp. Vui
                      lòng tải xuống để xem.
                    </p>
                    <Button
                      onClick={() =>
                        viewingDoc && handleDownloadDocument(viewingDoc)
                      }
                    >
                      <Download className="w-4 h-4 mr-2" /> Tải xuống
                    </Button>
                  </div>
                );
              }

              if (type.includes("image/")) {
                return previewUrl ? (
                  <div className="h-full overflow-auto">
                    <img
                      src={previewUrl}
                      alt={viewingDoc.tenFile || "image"}
                      className="max-h-[70vh] object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Đang tải ảnh…
                  </div>
                );
              }

              if (type.includes("pdf")) {
                return previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] rounded border"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Đang tải PDF…
                  </div>
                );
              }

              return previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded border"
                  title="File Preview"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <p className="text-slate-600">Không thể xem trước tệp này.</p>
                  <Button
                    onClick={() =>
                      viewingDoc && handleDownloadDocument(viewingDoc)
                    }
                  >
                    <Download className="w-4 h-4 mr-2" /> Tải xuống
                  </Button>
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
