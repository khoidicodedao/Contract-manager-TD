"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useQuery } from "@tanstack/react-query";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

const fieldOptions = [
  {
    group: "Hợp đồng",
    key: "hopDong",
    fields: [
      { key: "ten", label: "Tên hợp đồng" },
      { key: "soHdNoi", label: "Số HĐ nội" },
      { key: "soHdNgoai", label: "Số HĐ ngoài" },
      { key: "ngay", label: "Ngày ký" },
      { key: "giaTriHopDong", label: "Giá trị hợp đồng" },
      { key: "moTa", label: "Mô tả" },
      { key: "phiUyThac", label: "Phí ủy thác" },
      { key: "tyGia", label: "Tỷ giá" },
    ],
  },
  {
    group: "Cán bộ",
    key: "canBo",
    fields: [
      { key: "ten", label: "Cán bộ phụ trách" },
      { key: "email", label: "Email" },
    ],
  },
  {
    group: "Nhà cung cấp",
    key: "nhaCungCap",
    fields: [
      { key: "ten", label: "Tên nhà cung cấp" },
      { key: "diaChi", label: "Địa chỉ" },
      // { key: "soDienThoai", label: "Số điện thoại" },
    ],
  },
  {
    group: "Chủ đầu tư",
    key: "chuDauTu",
    fields: [{ key: "ten", label: "Chủ đầu tư" }],
  },
  {
    group: "Cấp tiền",
    key: "capTien",
    fields: [
      { key: "ngayCap", label: "Ngày cấp" },
      { key: "soTien", label: "Số tiền" },
      { key: "loaiTien", label: "Loại tiền" },
      { key: "tyGia", label: "Tỷ giá" },
      { key: "ghiChu", label: "Ghi chú" },
      { key: "benCap", label: "Bên cấp" },
      { key: "soTienQuyDoi", label: "Số tiền quy đổi" },
      { key: "loaiTienQuyDoi", label: "Loại tiền quy đổi" },
    ],
  },
  {
    group: "Tiến độ",
    key: "buocThucHien",
    fields: [
      { key: "ten", label: "Tên tiến độ" },
      { key: "ngayBatDau", label: "Ngày bắt đầu" },
      { key: "ngayKetThuc", label: "Ngày kết thúc" },
      { key: "trangThai", label: "Trạng thái" },
    ],
  },
  {
    group: "Nhập/Xuất",
    key: "tiepNhan",
    fields: [
      { key: "tenHang", label: "Tên hàng" },
      { key: "hinhThuc", label: "Hình thức" },
      { key: "soToKhai", label: "Số tờ khai" },
      { key: "soVanDon", label: "Số vận đơn" },
      { key: "soHoaDon", label: "Số hóa đơn" },
      { key: "soPhieuDongGoi", label: "Số phiếu đóng gói" },
      { key: "soBaoHiem", label: "Số bảo hiểm" },
      { key: "diaDiemThongQuan", label: "Địa điểm thông quan" },
      { key: "ngayThucHien", label: "Ngày thực hiện" },
      { key: "soGiayPhep", label: "Số giấy phép" },
      { key: "thoiHanGiayPhep", label: "Thời hạn giấy phép" },
      { key: "soHaiQuanDacBiet", label: "Số Hải quan đặc biệt" },
      { key: "soThongBaoMienThue", label: "Số thông báo miễn thuế" },
      { key: "soBienBanBanGiao", label: "Số biên bản bàn giao" },
      { key: "ngayBanGiao", label: "Ngày bàn giao" },
      { key: "maHsCode", label: "Mã HS Code" },
    ],
  },
  {
    group: "Bảo lãnh",
    key: "baoLanh",
    fields: [
      { key: "soBaoLanh", label: "Số bảo lãnh" },
      { key: "triGia", label: "Trị giá" },
      { key: "tyLe", label: "Tỷ lệ (%)" },
      { key: "ngayCap", label: "Ngày cấp" },
      { key: "thoiHan", label: "Thời hạn" },
      { key: "nguoiThuHuong", label: "Người thụ hưởng" },
    ],
  },
  {
    group: "Thư tín dụng",
    key: "thuTinDung",
    fields: [
      { key: "soLc", label: "Số L/C" },
      { key: "ngayMo", label: "Ngày mở" },
      { key: "triGia", label: "Trị giá" },
      { key: "thoiHan", label: "Thời hạn" },
      { key: "nguoiThuHuong", label: "Người thụ hưởng" },
    ],
  },
];

export default function ExportHopDongView() {
  const { data: exportData = [] } = useQuery<any[]>({
    queryKey: ["/api/export/hop-dong"],
  });

  const { data: buocThucHien = [] } = useQuery<any[]>({
    queryKey: ["/api/buoc-thuc-hien"],
  });

  const { data: tiepNhan = [] } = useQuery<any[]>({
    queryKey: ["/api/tiep-nhan"],
  });

  const [selectedFields, setSelectedFields] = useState<
    Record<string, string[]>
  >({});

  const toggleField = (groupKey: string, fieldKey: string) => {
    setSelectedFields((prev) => {
      const current = prev[groupKey] || [];
      const updated = current.includes(fieldKey)
        ? current.filter((f) => f !== fieldKey)
        : [...current, fieldKey];
      return { ...prev, [groupKey]: updated };
    });
  };

  const buildGroupCell = (group: any, item: any) => {
    const selected = selectedFields[group.key] || [];
    if (selected.length === 0) return "";

    // Nếu là cấp tiền (mảng nhiều dòng)
    if (group.key === "capTien" && Array.isArray(item.capTien)) {
      return item.capTien
        .map((ct: any, idx: number) =>
          selected
            .map((fieldKey) => {
              const fieldMeta = group.fields.find((f: any) => f.key === fieldKey);
              const label = fieldMeta?.label || fieldKey;
              return `${label}: ${ct[fieldKey] ?? ""}`;
            })
            .join(" | ")
        )
        .join("\n"); // xuống dòng mỗi lần cấp
    }

    // Nếu là tiến độ (mảng nhiều dòng)
    if (group.key === "buocThucHien" && Array.isArray(buocThucHien)) {
      return buocThucHien
        .map((step: any, idx: number) =>
          selected
            .map((fieldKey) => {
              const fieldMeta = group.fields.find((f: any) => f.key === fieldKey);
              const label = fieldMeta?.label || fieldKey;
              return `${label}: ${step[fieldKey] ?? ""}`;
            })
            .join(" | ")
        )
        .join("\n"); // xuống dòng mỗi lần bước
    }

    // Nếu là tiếp nhận (mảng nhiều dòng)
    if (group.key === "tiepNhan" && Array.isArray(tiepNhan)) {
      return tiepNhan
        .map((tn: any) =>
          selected
            .map((fieldKey) => {
              const fieldMeta = group.fields.find((f: any) => f.key === fieldKey);
              const label = fieldMeta?.label || fieldKey;
              return `${label}: ${tn[fieldKey] ?? ""}`;
            })
            .join(" | ")
        )
        .join("\n"); // xuống dòng mỗi lần tiếp nhận
    }

    // Nếu là bảo lãnh (mảng nhiều dòng)
    if (group.key === "baoLanh" && Array.isArray(item.baoLanh)) {
      return item.baoLanh
        .map((bl: any) =>
          selected
            .map((fieldKey) => {
              const fieldMeta = group.fields.find((f: any) => f.key === fieldKey);
              const label = fieldMeta?.label || fieldKey;
              return `${label}: ${bl[fieldKey] ?? ""}`;
            })
            .join(" | ")
        )
        .join("\n");
    }

    // Nếu là thư tín dụng (mảng nhiều dòng)
    if (group.key === "thuTinDung" && Array.isArray(item.thuTinDung)) {
      return item.thuTinDung
        .map((lc: any) =>
          selected
            .map((fieldKey) => {
              const fieldMeta = group.fields.find((f: any) => f.key === fieldKey);
              const label = fieldMeta?.label || fieldKey;
              return `${label}: ${lc[fieldKey] ?? ""}`;
            })
            .join(" | ")
        )
        .join("\n");
    }

    // Các group khác (object 1 cấp)
    if (item[group.key]) {
      return selected
        .map((fieldKey) => {
          const fieldMeta = group.fields.find((f: any) => f.key === fieldKey);
          const label = fieldMeta?.label || fieldKey;
          return `${label}: ${item[group.key][fieldKey] ?? ""}`;
        })
        .join("\n"); // xuống dòng trong cùng 1 ô
    }

    return "";
  };

  const handleExport = () => {
    const rows = exportData.map((item) => {
      const row: Record<string, any> = {};
      for (const group of fieldOptions) {
        const groupValue = buildGroupCell(group, item);
        if (groupValue) {
          row[group.group] = groupValue;
        }
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HopDongExport");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buffer]), "hop_dong_export.xlsx");
  };

  const previewData = exportData.slice(0, 5).map((item) => {
    const row: Record<string, any> = {};
    for (const group of fieldOptions) {
      const groupValue = buildGroupCell(group, item);
      if (groupValue) {
        row[group.group] = groupValue;
      }
    }
    return row;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Xuất dữ liệu hợp đồng"
          subtitle="Chọn trường và xuất dữ liệu hợp đồng ra Excel"
          onCreateContract={() => { }}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Chọn trường để xuất dữ liệu</h2>
            {fieldOptions.map((group) => (
              <div key={group.key}>
                <h3 className="font-semibold mb-2">{group.group}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {group.fields.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={
                          selectedFields[group.key]?.includes(field.key) ||
                          false
                        }
                        onCheckedChange={() =>
                          toggleField(group.key, field.key)
                        }
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {Object.values(selectedFields).some((arr) => arr.length > 0) &&
              previewData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Xem trước dữ liệu
                  </h3>
                  <div className="overflow-auto border rounded">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr>
                          {Object.keys(previewData[0]).map((header) => (
                            <th
                              key={header}
                              className="border px-2 py-1 bg-gray-100"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            {Object.values(row).map((cell, i) => (
                              <td
                                key={i}
                                className="border px-2 py-1 whitespace-pre-line"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            <Button onClick={handleExport} className="mt-4">
              <Download className="w-4 h-4 mr-2" /> Xuất Excel
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
