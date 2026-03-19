"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useQuery } from "@tanstack/react-query";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Input } from "@/components/ui/input";

export default function ExportHopDongView() {
  const { data: exportData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/export/hop-dong"],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHopDongIds, setSelectedHopDongIds] = useState<number[]>([]);

  const filteredData = exportData.filter((item) =>
    item.hopDong.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.hopDong.soHdNoi && item.hopDong.soHdNoi.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.hopDong.soHdNgoai && item.hopDong.soHdNgoai.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedHopDongIds.length === filteredData.length) {
      setSelectedHopDongIds([]);
    } else {
      setSelectedHopDongIds(filteredData.map((item) => item.hopDong.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedHopDongIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const dataToExport = exportData.filter((item) =>
      selectedHopDongIds.includes(item.hopDong.id)
    );

    if (dataToExport.length === 0) {
      alert("Vui lòng chọn ít nhất một hợp đồng để xuất.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows: any[][] = [];

    // Row 1: Group Headers
    const groupHeader = [
      "Thông tin hợp đồng", "", "", "", "", "", "", "", "", "",
      "Cấp tiền", "", "", "", "",
      "Thanh toán", "", "", "", "",
      "Tiến độ", "", ""
    ];
    rows.push(groupHeader);

    // Row 2: Column Headers
    const colHeader = [
      "Tên hợp đồng", "Chủ đầu tư", "Số HĐ nội", "Số HĐ ngoại", "Ngày ký", "Giá trị HĐ", "Phí ủy thác", "Tỷ giá", "Cán bộ", "Nhà cung cấp",
      "Số tiền", "Ngày cấp", "Loại tiền", "Tỷ giá", "Ghi chú",
      "Số tiền", "Loại tiền", "Nội dung", "Hình thức", "Đã thanh toán",
      "Tên tiến độ", "Ngày bắt đầu", "Ngày kết thúc"
    ];
    rows.push(colHeader);

    // Merges for Row 1
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },   // Thông tin hợp đồng
      { s: { r: 0, c: 10 }, e: { r: 0, c: 14 } }, // Cấp tiền
      { s: { r: 0, c: 15 }, e: { r: 0, c: 19 } }, // Thanh toán
      { s: { r: 0, c: 20 }, e: { r: 0, c: 22 } }  // Tiến độ
    ];

    dataToExport.forEach((item) => {
      const maxRows = Math.max(
        item.capTien.length,
        item.thanhToan.length,
        item.buocThucHien.length,
        1
      );

      const startRow = rows.length;

      for (let i = 0; i < maxRows; i++) {
        const row: any[] = [];
        
        // Contract Info (only show in first row of contract group or merged later)
        if (i === 0) {
          row.push(item.hopDong.ten || "");
          row.push(item.chuDauTu?.ten || "");
          row.push(item.hopDong.soHdNoi || "");
          row.push(item.hopDong.soHdNgoai || "");
          row.push(item.hopDong.ngay || "");
          row.push(item.hopDong.giaTriHopDong || 0);
          row.push(item.hopDong.phiUyThac || 0);
          row.push(item.hopDong.tyGia || 1);
          row.push(item.canBo?.ten || "");
          row.push(item.nhaCungCap?.ten || "");
        } else {
          row.push("", "", "", "", "", "", "", "", "", "");
        }

        // Cấp tiền
        const ct = item.capTien[i];
        if (ct) {
          row.push(ct.soTien || 0);
          row.push(ct.ngayCap || "");
          row.push(ct.loaiTienTen || "");
          row.push(ct.tyGia || 1);
          row.push(ct.ghiChu || "");
        } else {
          row.push("", "", "", "", "");
        }

        // Thanh toán
        const tt = item.thanhToan[i];
        if (tt) {
          row.push(tt.soTien || 0);
          row.push(tt.loaiTienTen || "");
          row.push(tt.noiDung || "");
          row.push(tt.hinhThucTen || "");
          row.push(tt.daThanhToan ? "Đã thanh toán" : "Chưa thanh toán");
        } else {
          row.push("", "", "", "", "");
        }

        // Tiến độ
        const bth = item.buocThucHien[i];
        if (bth) {
          row.push(bth.ten || "");
          row.push(bth.ngayBatDau || "");
          row.push(bth.ngayKetThuc || "");
        } else {
          row.push("", "", "");
        }

        rows.push(row);
      }

      // Merge contract info columns for this contract group
      if (maxRows > 1) {
        for (let c = 0; c < 10; c++) {
          merges.push({ s: { r: startRow, c }, e: { r: startRow + maxRows - 1, c } });
        }
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = merges;

    // Set column widths
    ws['!cols'] = colHeader.map(() => ({ wch: 20 }));

    const wbFinal = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbFinal, ws, "HopDong_TongHop");
    const buffer = XLSX.write(wbFinal, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buffer]), `hop_dong_tong_hop_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Xuất dữ liệu hợp đồng"
          subtitle="Chọn hợp đồng và xuất dữ liệu theo định dạng tổng hợp"
          onCreateContract={() => { }}
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Danh sách hợp đồng</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Tìm kiếm hợp đồng..."
                    className="pl-8 w-64 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedHopDongIds.length === filteredData.length && filteredData.length > 0
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
                <Button size="sm" onClick={handleExport} disabled={selectedHopDongIds.length === 0}>
                  <Download className="w-4 h-4 mr-2" /> Xuất Excel ({selectedHopDongIds.length})
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="w-10 p-3 text-left">
                        <Checkbox
                          checked={selectedHopDongIds.length === filteredData.length && filteredData.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-3 text-left font-medium">Tên hợp đồng</th>
                      <th className="p-3 text-left font-medium">Số HĐ nội</th>
                      <th className="p-3 text-left font-medium">Số HĐ ngoại</th>
                      <th className="p-3 text-left font-medium">Ngày ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Đang tải dữ liệu...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy hợp đồng nào
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr 
                          key={item.hopDong.id} 
                          className="border-t hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => toggleSelect(item.hopDong.id)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedHopDongIds.includes(item.hopDong.id)}
                              onCheckedChange={() => toggleSelect(item.hopDong.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{item.hopDong.ten}</td>
                          <td className="p-3">{item.hopDong.soHdNoi}</td>
                          <td className="p-3">{item.hopDong.soHdNgoai}</td>
                          <td className="p-3">{item.hopDong.ngay}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 italic text-sm text-blue-800">
               * Lưu ý: File Excel xuất ra sẽ bao gồm thông tin hợp đồng, chi tiết cấp tiền, thanh toán và tiến độ thực hiện được trình bày theo định dạng tổng hợp.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
