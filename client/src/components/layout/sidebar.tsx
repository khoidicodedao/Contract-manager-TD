import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  File,
  Users,
  Building2,
  Settings,
  CreditCard,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Inbox,
  DollarSign,
  FileSpreadsheet,
  CalendarDays,
  FileText,
  Scale,
  Plane,
  Shield,
  Stamp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { HopDong } from "@shared/schema";
import { CanBo } from "@shared/schema";

export function Sidebar() {
  const { data: contracts = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/hop-dong"],
  });
  const { data: canBo = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/can-bo"],
  });
  const { data: nhaCungCap = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/nha-cung-cap"],
  });
  const { data: trangBi = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/trang-bi"],
  });
  const { data: taiLieu = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/file-hop-dong"],
  });
  const { data: chuDauTu = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/chu-dau-tu"],
  });
  const { data: tiepNhan = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/tiep-nhan"],
  });
  const { data: loaiNganSach = [] } = useQuery<HopDong[]>({
    queryKey: ["/api/loai-ngan-sach"],
  });
  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/hoa-don"],
  });
  const { data: legalDocs = [] } = useQuery<any[]>({
    queryKey: ["/api/van-ban-phap-ly"],
  });
  const { data: missions = [] } = useQuery<any[]>({
    queryKey: ["/api/doan-ra-vao"],
  });
  const { data: guarantees = [] } = useQuery<any[]>({
    queryKey: ["/api/bao-lanh"],
  });
  const { data: lcList = [] } = useQuery<any[]>({
    queryKey: ["/api/thu-tin-dung"],
  });
  const { data: plannedCosts = [] } = useQuery<any[]>({
    queryKey: ["/api/chi-phi-theo-hop-dong"],
  });
  const navigationGroups = [
    {
      group: "Chính",
      items: [
        {
          name: "Tổng quan",
          href: "/",
          icon: BarChart3,
          current: false,
          color: "text-sky-600",
        },
      ],
    },
    {
      group: "Quản lý",
      items: [
        {
          name: "Thông tin Hợp đồng",
          href: "/hop-dong",
          icon: File,
          current: false,
          badge: contracts.length > 0 ? contracts.length : "",
          color: "text-blue-600",
        },
        {
          name: "Cán bộ",
          href: "/can-bo",
          icon: Users,
          current: false,
          badge: canBo.length > 0 ? canBo.length : "",
          color: "text-emerald-600",
        },
        {
          name: "Nhà cung cấp",
          href: "/nha-cung-cap",
          icon: Building2,
          current: false,
          badge: nhaCungCap.length > 0 ? nhaCungCap.length : "",
          color: "text-amber-600",
        },
        {
          name: "Chủ đầu tư",
          href: "/chu-dau-tu",
          icon: Users,
          current: false,
          badge: chuDauTu.length > 0 ? chuDauTu.length : "",
          color: "text-purple-600",
        },
        {
          name: "Trang bị",
          href: "/trang-bi",
          icon: Settings,
          current: false,
          badge: trangBi.length > 0 ? trangBi.length : "",
          color: "text-cyan-600",
        },
      ],
    },
    {
      group: "Tài chính",
      items: [
        {
          name: "Thanh toán",
          href: "/thanh-toan",
          icon: CreditCard,
          current: false,
          color: "text-pink-600",
        },
        {
          name: "Cấp tiền",
          href: "/cap-tien",
          icon: DollarSign,
          current: false,
          color: "text-green-600",
        },
        {
          name: "Hóa đơn",
          href: "/hoa-don",
          icon: FileText,
          current: false,
          badge: invoices.length > 0 ? invoices.length : "",
          color: "text-indigo-600",
        },
        {
          name: "Văn bản pháp lý",
          href: "/van-ban-phap-ly",
          icon: Scale,
          current: false,
          badge: legalDocs.length > 0 ? legalDocs.length : "",
          color: "text-amber-600",
        },
        {
          name: "Đoàn ra/vào",
          href: "/doan-ra-vao",
          icon: Plane,
          current: false,
          badge: missions.length > 0 ? missions.length : "",
          color: "text-sky-600",
        },
        {
          name: "Loại ngân sách",
          href: "/loai-ngan-sach",
          icon: DollarSign,
          current: false,
          badge: loaiNganSach.length > 0 ? loaiNganSach.length : "",
          color: "text-teal-600",
        },
        {
          name: "Bảo lãnh",
          href: "/bao-lanh",
          icon: Shield,
          current: false,
          badge: guarantees.length > 0 ? guarantees.length : "",
          color: "text-orange-500",
        },
        {
          name: "Thư tín dụng",
          href: "/thu-tin-dung",
          icon: Stamp,
          current: false,
          badge: lcList.length > 0 ? lcList.length : "",
          color: "text-blue-500",
        },
        {
          name: "Chi phí thực tế",
          href: "/chi-phi-thuc-te",
          icon: DollarSign,
          current: false,
          color: "text-red-600",
        },
        {
          name: "Chi phí Hợp đồng",
          href: "/chi-phi-theo-hop-dong",
          icon: FolderOpen,
          current: false,
          badge: plannedCosts.length > 0 ? plannedCosts.length : "",
          color: "text-green-700",
        },
      ],
    },
    {
      group: "Hoạt động",
      items: [
        {
          name: "Theo dõi",
          href: "/tien-do",
          icon: CheckSquare,
          current: false,
          color: "text-violet-600",
        },
        {
          name: "Tài liệu",
          href: "/tai-lieu",
          icon: FolderOpen,
          current: false,
          badge: taiLieu.length > 0 ? taiLieu.length : "",
          color: "text-orange-600",
        },
        {
          name: "Nhập/Xuất",
          href: "/tiep-nhan",
          icon: Inbox,
          current: false,
          badge: tiepNhan.length > 0 ? tiepNhan.length : "",
          color: "text-rose-600",
        },
      ],
    },
    {
      group: "Báo cáo & Lịch",
      items: [
        {
          name: "Xuất báo cáo",
          href: "/xuat-du-lieu",
          icon: FileSpreadsheet,
          current: false,
          color: "text-green-700",
        },
        {
          name: "Lịch làm việc",
          href: "/lich",
          icon: CalendarDays,
          current: false,
          color: "text-red-500",
        },
      ],
    },
    {
      group: "Hệ thống",
      items: [
        {
          name: "Cài đặt",
          href: "/cai-dat",
          icon: Settings,
          current: false,
          color: "text-gray-600",
        },
      ],
    },
  ];
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div
        className="p-6 border-b border-slate-200"
        style={{ paddingTop: "40px" }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <File className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Quản lý dự án
            </h1>
            {/* <p className="text-xs text-slate-500">Quản lý hợp đồng</p> */}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.group} className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.group}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn("sidebar-nav-item", isActive && "active")}>
                    <Icon className={cn("w-5 h-5", item.color)} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-primary text-white text-xs px-2 py-1">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      {/* <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"
            alt="Avatar người dùng"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              Ngô Văn Khang
            </p>
            <p className="text-xs text-slate-500 truncate">
              Quản lý dự án / Vaxuco
            </p>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600">
            <Settings className="text-sm" />
          </button>
        </div>
      </div> */}
    </div>
  );
}

export default Sidebar;
