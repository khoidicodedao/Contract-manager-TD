import { Express } from "express";
import { Server } from "http";
import { eq, ilike, sql } from "drizzle-orm";
import { db } from "./database.js";
import * as schema from "../shared/schema.js";

import {
  insertLoaiHopDongSchema,
  insertCanBoSchema,
  insertNhaCungCapSchema,
  insertChuDauTuSchema,
  insertHopDongSchema,
  insertLoaiNganSachSchema,
  insertLoaiTienSchema,
  insertThanhToanSchema,
  insertTrangBiSchema,
  insertBuocThucHienSchema,
  insertFileHopDongSchema,
  insertHopDongTienDoSchema,
  insertDiaDiemThongQuanSchema,
  insertTiepNhanSchema,
  insertCapTienSchema,
  updateCapTienSchema,
  insertLoaiHoaDonSchema,
  insertHoaDonSchema,
  insertLoaiVanBanPhapLySchema,
  insertVanBanPhapLySchema,
  insertLoaiDoanRaVaoSchema,
  insertDoanRaVaoSchema,
  insertLoaiBaoLanhSchema,
  insertBaoLanhSchema,
  insertThuTinDungSchema,
} from "../shared/schema.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
const upload = multer({
  storage: multer.memoryStorage(), // Lưu file trong RAM (có thể đổi thành diskStorage)
  limits: {
    fileSize: 1000 * 1024 * 1024, // 10MB
  },
});
export async function registerRoutes(app: Express): Promise<void> {

  // ─── Thông báo: hợp đồng & thanh toán sắp / quá hạn ─────────────────────
  app.get("/api/notifications", async (req, res) => {
    try {
      const THRESHOLD_DAYS = 7;
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const diffDays = (dateStr: string | null | undefined): number | null => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      };

      const contracts = await db.select().from(schema.hopDong);
      const payments = await db.select().from(schema.thanhToan);

      const notifications: any[] = [];

      // --- Hợp đồng: dùng hanHopDong từ thanhToan (nếu có) ---
      // Lấy hanHopDong mới nhất của mỗi hợp đồng
      const contractDeadlines: Record<number, string> = {};
      for (const p of payments) {
        if (p.hopDongId && p.hanHopDong) {
          const existing = contractDeadlines[p.hopDongId];
          if (!existing || new Date(p.hanHopDong) > new Date(existing)) {
            contractDeadlines[p.hopDongId] = p.hanHopDong;
          }
        }
      }

      for (const [idStr, deadline] of Object.entries(contractDeadlines)) {
        const days = diffDays(deadline);
        if (days === null || days > THRESHOLD_DAYS) continue;
        const hopDongId = Number(idStr);
        const contract = contracts.find((c) => c.id === hopDongId);
        const label = contract?.soHdNgoai || contract?.soHdNoi || `HĐ #${hopDongId}`;
        notifications.push({
          id: `contract-${hopDongId}`,
          type: "contract",
          hopDongId,
          title: days < 0
            ? `Hợp đồng quá hạn ${Math.abs(days)} ngày`
            : days === 0 ? `Hợp đồng hết hạn hôm nay`
              : `Hợp đồng sắp hết hạn (${days} ngày)`,
          subtitle: `${label}${contract?.ten ? ` — ${contract.ten}` : ""} · Hạn: ${deadline}`,
          days,
          deadline,
          href: "/hop-dong",
        });
      }

      // --- Thanh toán: chưa thanh toán + hạn thực hiện sắp đến ---
      // Logic giống getPaymentStatus() trong payments.tsx:
      // deadline = hanThucHien (ưu tiên) hoặc hanHopDong (fallback)
      for (const p of payments) {
        if (p.daThanhToan) continue;

        // Ưu tiên hanThucHien, fallback về hanHopDong
        const deadlineStr = p.hanThucHien || p.hanHopDong;
        const days = diffDays(deadlineStr);
        if (days === null || days > THRESHOLD_DAYS) continue;

        const contract = contracts.find((c) => c.id === p.hopDongId);
        const label = contract?.soHdNgoai || contract?.soHdNoi || `HĐ #${p.hopDongId}`;
        const deadlineLabel = p.hanThucHien
          ? `Hạn TH: ${p.hanThucHien}`
          : `Hạn HĐ: ${p.hanHopDong}`;

        notifications.push({
          id: `payment-${p.id}`,
          type: "payment",
          hopDongId: p.hopDongId,
          paymentId: p.id,
          title: days < 0
            ? `Thanh toán quá hạn ${Math.abs(days)} ngày`
            : days === 0 ? `Thanh toán đến hạn hôm nay`
              : `Thanh toán sắp đến hạn (${days} ngày)`,
          subtitle: `${label}${p.noiDung ? ` · ${p.noiDung}` : ""} · ${deadlineLabel}${p.soTien ? ` · ${p.soTien.toLocaleString()}` : ""}`,
          days,
          deadline: deadlineStr,
          href: "/thanh-toan",
        });
      }


      notifications.sort((a, b) => a.days - b.days);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // ─── Cài đặt hệ thống ────────────────────────────────────────────────────
  app.get("/api/settings", async (req, res) => {
    try {
      const items = await db.select().from(schema.systemSettings);
      // Chuyển array thành object { key: value }
      const settings = items.reduce((acc: any, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settings = req.body; // { key: value }
      for (const [key, value] of Object.entries(settings)) {
        await db
          .insert(schema.systemSettings)
          .values({ key, value: String(value) })
          .onConflictDoUpdate({
            target: schema.systemSettings.key,
            set: { value: String(value) },
          });
      }
      res.json({ message: "Cập nhật cài đặt thành công" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật cài đặt" });
    }
  });

  // ─── Hợp đồng tiến độ ────────────────────────────────────────────────────
  app.get("/api/hop-dong-tien-do", async (req, res) => {
    try {
      const items = await db.select().from(schema.hopDongTienDo);
      res.json(items);
    } catch (error) {
      console.error("Error fetching hop dong tien do:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // System overview route
  app.get("/api/system/overview", async (req, res) => {

    try {
      const contracts = await db.select().from(schema.hopDong);
      const payments = await db.select().from(schema.thanhToan);
      const equipment = await db.select().from(schema.trangBi);
      const documents = await db.select().from(schema.fileHopDong);
      const progressSteps = await db.select().from(schema.buocThucHien);
      const loaiTienList = await db.select().from(schema.loaiTien);
      const totalValueByCurrency = loaiTienList.map((currency) => {
        const relatedContracts = contracts.filter(
          (c) => c.loaiTienId === currency.id
        );
        const total = relatedContracts.reduce(
          (sum, c) => sum + (c.giaTriHopDong || 0),
          0
        );
        return {
          currency: currency.ten,
          totalValue: total,
        };
      });
      const totalUyThacByCurrency = loaiTienList.map((currency) => {
        const relatedContracts = contracts.filter(
          (c) => c.loaiTienId === currency.id
        );
        const total = relatedContracts.reduce((sum, c) => {
          const phiUyThac = parseFloat(c.phiUyThac?.toString() || "0");
          const tyGia = parseFloat(c.tyGia?.toString() || "1"); // default 1 nếu không có tỷ giá
          return sum + phiUyThac * tyGia;
        }, 0);
        return {
          currency: currency.ten,
          totalValue: total,
        };
      });
      const stats = {
        totalContracts: contracts.length,
        activeContracts: contracts.filter((c) => c.trangThaiHopDongId === 1)
          .length,
        completedContracts: contracts.filter((c) => c.trangThaiHopDongId === 2)
          .length,
        pausedContracts: contracts.filter((c) => c.trangThaiHopDongId === 3)
          .length,
        totalValue: contracts.reduce(
          (sum, c) => sum + (c.giaTriHopDong || 0),
          0
        ),
        totalUyThacByCurrency,
        totalValueByCurrency, // 👉 thêm vào đây
        totalPayments: payments.length,
        pendingPayments: payments.filter((p) => p.daThanhToan === false).length,
        completedPayments: payments.filter((p) => p.daThanhToan === true)
          .length,
        totalEquipment: equipment.length,
        totalDocuments: documents.length,
        totalProgressSteps: progressSteps.length,
        inProgressSteps: progressSteps.filter(
          (p) => p.trangThai === "Đang thực hiện"
        ).length,
        completedSteps: progressSteps.filter(
          (p) => p.trangThai === "Hoàn thành"
        ).length,
        pendingSteps: progressSteps.filter(
          (p) => p.trangThai === "Chưa bắt đầu"
        ).length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching system overview:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Download project route
  app.get("/api/download/project", (req, res) => {
    const filePath =
      "/home/runner/workspace/vietnamese-contract-management-fixed.tar.gz";
    res.download(
      filePath,
      "vietnamese-contract-management-fixed.tar.gz",
      (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).json({ error: "Không thể tải file" });
        }
      }
    );
  });

  // Dashboard charts route
  app.get("/api/dashboard/charts", async (req, res) => {
    try {
      const contractTypes = await db.select().from(schema.loaiHopDong);
      const contracts = await db.select().from(schema.hopDong);

      const contractTypeData = contractTypes.map((type) => ({
        name: type.ten,
        value: contracts.filter((c) => c.loaiHopDongId === type.id).length,
      }));

      const payments = await db.select().from(schema.thanhToan);
      const paymentStatusData = [
        {
          name: "Đã thanh toán",
          value: payments.filter((p) => p.daThanhToan === true).length,
        },
        {
          name: "Chưa thanh toán",
          value:
            payments.filter((p) => p.daThanhToan === false).length ||
            payments.length,
        },
      ];

      const progressSteps = await db.select().from(schema.buocThucHien);
      const progressStatusData = [
        {
          name: "Hoàn thành",
          value: progressSteps.filter((p) => p.trangThai === "Hoàn thành")
            .length,
        },
        {
          name: "Đang thực hiện",
          value: progressSteps.filter((p) => p.trangThai === "Đang thực hiện")
            .length,
        },
        {
          name: "Chưa bắt đầu",
          value: progressSteps.filter((p) => p.trangThai === "Chưa bắt đầu")
            .length,
        },
      ];

      // Supplier statistics by country
      const suppliers = await db.select().from(schema.nhaCungCap);

      const supplierCountryMap = new Map<string, number>();

      for (const supplier of suppliers) {
        const code = supplier.maQuocGia;
        if (!code) continue; // Bỏ qua nếu thiếu mã quốc gia

        supplierCountryMap.set(code, (supplierCountryMap.get(code) ?? 0) + 1);
      }

      const supplierCountryData = Array.from(supplierCountryMap.entries())
        .map(([name, value]) => ({ name: name, value }))
        .filter((item) => item.value > 0);

      // World map data for countries with suppliers and contracts
      const supplierMap = new Map<
        string,
        { count: number; suppliers: typeof suppliers }
      >();
      for (const supplier of suppliers) {
        if (!supplier.maQuocGia) continue;

        if (!supplierMap.has(supplier.maQuocGia)) {
          supplierMap.set(supplier.diaChi, {
            count: 0,
            suppliers: [],
          });
        }

        const group = supplierMap.get(supplier.diaChi)!;
        group.suppliers.push(supplier);
        group.count++;
      }

      const worldMapData = [];

      for (const [
        countryCode,

        { suppliers: countrySuppliers },
      ] of Array.from(supplierMap.entries())) {
        // Đếm hợp đồng liên quan
        const contractCount = contracts.filter((contract) =>
          countrySuppliers.some(
            (supplier: any) => supplier.id === contract.nhaCungCapId
          )
        ).length;

        if (contractCount > 0) {
          // Lấy tọa độ trung bình từ các supplier trong quốc gia đó

          worldMapData.push({
            country: countryCode, // vẫn dùng mã quốc gia làm tên
            count: contractCount,
            suppliers: countrySuppliers.length,
          });
        }
      }

      res.json({
        contractTypes: contractTypeData,
        paymentStatus: paymentStatusData,
        progressStatus: progressStatusData,
        supplierCountries: supplierCountryData,
        worldMap: worldMapData,
        monthlyTrend: [],
      });
    } catch (error) {
      console.error("Error fetching dashboard charts:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Loại hợp đồng routes
  app.get("/api/loai-hop-dong", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiHopDong);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/loai-hop-dong", async (req, res) => {
    try {
      const validatedData = insertLoaiHopDongSchema.parse(req.body);
      const items = await db
        .insert(schema.loaiHopDong)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating loai hop dong:", error);
      res.status(500).json({ error: "Lỗi khi tạo loại hợp đồng" });
    }
  });

  // Cán bộ routes
  app.get("/api/can-bo", async (req, res) => {
    try {
      const items = await db.select().from(schema.canBo);
      res.json(items);
    } catch (error) {
      console.error("Error fetching can bo:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách cán bộ" });
    }
  });

  app.post("/api/can-bo", async (req, res) => {
    try {
      const validatedData = insertCanBoSchema.parse(req.body);
      const items = await db
        .insert(schema.canBo)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating can bo:", error);
      res.status(500).json({ error: "Lỗi khi tạo cán bộ" });
    }
  });
  app.put("/api/can-bo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCanBoSchema.parse(req.body);

      const updated = await db
        .update(schema.canBo)
        .set(validatedData)
        .where(eq(schema.canBo.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy cán bộ" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating can bo:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật cán bộ" });
    }
  });
  app.delete("/api/can-bo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(id);
      const deleted = await db
        .delete(schema.canBo)
        .where(eq(schema.canBo.id, id))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy cán bộ để xóa" });
      }

      res.json({ message: "Đã xóa cán bộ thành công", item: deleted[0] });
    } catch (error) {
      console.error("Error deleting can bo:", error);
      res.status(500).json({ error: "Lỗi khi xóa cán bộ" });
    }
  });

  // Nhà cung cấp routes
  app.get("/api/nha-cung-cap", async (req, res) => {
    try {
      const items = await db.select().from(schema.nhaCungCap);
      res.json(items);
    } catch (error) {
      console.error("Error fetching nha cung cap:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách nhà cung cấp" });
    }
  });

  app.post("/api/nha-cung-cap", async (req, res) => {
    try {
      const validatedData = insertNhaCungCapSchema.parse(req.body);
      const items = await db
        .insert(schema.nhaCungCap)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating nha cung cap:", error);
      res.status(500).json({ error: "Lỗi khi tạo nhà cung cấp" });
    }
  });
  app.put("/api/nha-cung-cap/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertNhaCungCapSchema.parse(req.body);

      const updated = await db
        .update(schema.nhaCungCap)
        .set(validatedData)
        .where(eq(schema.nhaCungCap.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy nhà cung cấp" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating nha cung cap:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật nhà cung cấp" });
    }
  });
  app.delete("/api/nha-cung-cap/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const deleted = await db
        .delete(schema.nhaCungCap)
        .where(eq(schema.nhaCungCap.id, id))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy nhà cung cấp" });
      }

      res.json({ message: "Đã xoá nhà cung cấp thành công" });
    } catch (error) {
      console.error("Error deleting nha cung cap:", error);
      res.status(500).json({ error: "Lỗi khi xoá nhà cung cấp" });
    }
  });

  // Chủ đầu tư routes
  app.get("/api/chu-dau-tu", async (req, res) => {
    try {
      const items = await db.select().from(schema.chuDauTu);
      res.json(items);
    } catch (error) {
      console.error("Error fetching chu dau tu:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/chu-dau-tu", async (req, res) => {
    try {
      const validatedData = insertChuDauTuSchema.parse(req.body);
      const items = await db
        .insert(schema.chuDauTu)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating chu dau tu:", error);
      res.status(500).json({ error: "Lỗi khi tạo chủ đầu tư" });
    }
  });
  // Cập nhật chủ đầu tư
  app.put("/api/chu-dau-tu/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertChuDauTuSchema.parse(req.body); // Sử dụng schema giống POST
      const updated = await db
        .update(schema.chuDauTu)
        .set(validatedData)
        .where(eq(schema.chuDauTu.id, Number(id)))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy chủ đầu tư" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating chu dau tu:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật chủ đầu tư" });
    }
  });

  // Xóa chủ đầu tư
  app.delete("/api/chu-dau-tu/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db
        .delete(schema.chuDauTu)
        .where(eq(schema.chuDauTu.id, Number(id)))
        .returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy chủ đầu tư" });
      }
      res.json({ message: "Đã xóa thành công", data: deleted[0] });
    } catch (error) {
      console.error("Error deleting chu dau tu:", error);
      res.status(500).json({ error: "Lỗi khi xóa chủ đầu tư" });
    }
  });

  // Loại ngân sách routes
  app.get("/api/loai-ngan-sach", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiNganSach);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai ngan sach:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Tạo loại ngân sách mới
  app.post("/api/loai-ngan-sach", async (req, res) => {
    try {
      const { ten } = req.body;
      if (!ten) {
        return res
          .status(400)
          .json({ error: "Tên loại ngân sách là bắt buộc" });
      }

      const [newItem] = await db
        .insert(schema.loaiNganSach)
        .values({ ten })
        .returning();

      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating loai ngan sach:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Cập nhật loại ngân sách
  app.put("/api/loai-ngan-sach/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { ten } = req.body;

      const [updated] = await db
        .update(schema.loaiNganSach)
        .set({ ten })
        .where(eq(schema.loaiNganSach.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Không tìm thấy loại ngân sách" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating loai ngan sach:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Xóa loại ngân sách
  app.delete("/api/loai-ngan-sach/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const [deleted] = await db
        .delete(schema.loaiNganSach)
        .where(eq(schema.loaiNganSach.id, id))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Không tìm thấy loại ngân sách" });
      }

      res.json({ message: "Đã xóa thành công", deleted });
    } catch (error) {
      console.error("Error deleting loai ngan sach:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });
  // Loại tiền routes
  app.get("/api/loai-tien", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiTien);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai tien:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Trạng thái hợp đồng routes
  app.get("/api/trang-thai-hop-dong", async (req, res) => {
    try {
      const items = await db.select().from(schema.trangThaiHopDong);
      res.json(items);
    } catch (error) {
      console.error("Error fetching trang thai hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Hợp đồng routes
  app.get("/api/hop-dong", async (req, res) => {
    console.log("🔍 API /api/hop-dong được gọi");
    const search = req.query.search;
    console.log("Search:", search);
    try {
      let items;

      if (search) {
        const keyword = `%${search}%`;
        items = await db
          .select()
          .from(schema.hopDong)
          .where(
            sql`LOWER(${schema.hopDong.ten}) LIKE LOWER(${keyword}) OR LOWER(${schema.hopDong.soHdNgoai}) LIKE LOWER(${keyword})`
          );
      } else {
        items = await db.select().from(schema.hopDong);
      }

      res.json(items);
    } catch (error) {
      console.error("Error fetching hop dong:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách hợp đồng" });
    }
  });

  app.post("/api/hop-dong", async (req, res) => {
    try {
      const validatedData = insertHopDongSchema.parse(req.body);
      const items = await db
        .insert(schema.hopDong)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating hop dong:", error);
      res.status(500).json({ error: "Lỗi khi tạo hợp đồng" });
    }
  });

  // Loại hóa đơn routes
  app.get("/api/loai-hoa-don", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiHoaDon);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai hoa don:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/loai-hoa-don", async (req, res) => {
    try {
      const validatedData = insertLoaiHoaDonSchema.parse(req.body);
      const [newItem] = await db
        .insert(schema.loaiHoaDon)
        .values(validatedData)
        .returning();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating loai hoa don:", error);
      res.status(500).json({ error: "Lỗi khi tạo loại hóa đơn" });
    }
  });

  app.put("/api/loai-hoa-don/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLoaiHoaDonSchema.parse(req.body);
      const [updated] = await db
        .update(schema.loaiHoaDon)
        .set(validatedData)
        .where(eq(schema.loaiHoaDon.id, Number(id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating loai hoa don:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật" });
    }
  });

  app.delete("/api/loai-hoa-don/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(schema.loaiHoaDon)
        .where(eq(schema.loaiHoaDon.id, Number(id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(deleted);
    } catch (error) {
      console.error("Error deleting loai hoa don:", error);
      res.status(500).json({ error: "Lỗi khi xóa" });
    }
  });

  // Hóa đơn routes
  app.get("/api/hoa-don", async (req, res) => {
    const { hopDongId, search } = req.query;
    try {
      if (search) {
        const keyword = `%${search}%`;
        const items = await db
          .select({
            hoaDon: schema.hoaDon,
            hopDong: schema.hopDong
          })
          .from(schema.hoaDon)
          .leftJoin(schema.hopDong, eq(schema.hoaDon.hopDongId, schema.hopDong.id))
          .where(
            sql`LOWER(${schema.hopDong.soHdNgoai}) LIKE LOWER(${keyword}) OR LOWER(${schema.hopDong.soHdNoi}) LIKE LOWER(${keyword}) OR LOWER(${schema.hoaDon.tenHoaDon}) LIKE LOWER(${keyword})`
          );
        return res.json(items.map(i => ({ ...i.hoaDon, hopDong: i.hopDong })));
      }

      let query = db.select().from(schema.hoaDon).$dynamic();
      if (hopDongId) {
        query = query.where(eq(schema.hoaDon.hopDongId, Number(hopDongId)));
      }

      const items = await query;
      res.json(items);
    } catch (error) {
      console.error("Error fetching hoa don:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách hóa đơn" });
    }
  });

  app.post("/api/hoa-don", async (req, res) => {
    try {
      const validatedData = insertHoaDonSchema.parse(req.body);
      const [newItem] = await db
        .insert(schema.hoaDon)
        .values(validatedData)
        .returning();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating hoa don:", error);
      res.status(500).json({ error: "Lỗi khi tạo hóa đơn" });
    }
  });

  app.put("/api/hoa-don/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertHoaDonSchema.parse(req.body);
      const [updated] = await db
        .update(schema.hoaDon)
        .set(validatedData)
        .where(eq(schema.hoaDon.id, Number(id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating hoa don:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật hóa đơn" });
    }
  });

  app.delete("/api/hoa-don/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(schema.hoaDon)
        .where(eq(schema.hoaDon.id, Number(id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(deleted);
    } catch (error) {
      console.error("Error deleting hoa don:", error);
      res.status(500).json({ error: "Lỗi khi xóa hóa đơn" });
    }
  });

  // Loại văn bản pháp lý routes
  app.get("/api/loai-van-ban-phap-ly", async (req, res) => {
    const { hopDongId } = req.query;
    try {
      let query = db.select().from(schema.loaiVanBanPhapLy).$dynamic();
      if (hopDongId) {
        query = query.where(eq(schema.loaiVanBanPhapLy.hopDongId, Number(hopDongId)));
      }
      const items = await query;
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/loai-van-ban-phap-ly", async (req, res) => {
    try {
      const validatedData = insertLoaiVanBanPhapLySchema.parse(req.body);
      const [newItem] = await db
        .insert(schema.loaiVanBanPhapLy)
        .values(validatedData)
        .returning();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating loai van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi tạo loại văn bản" });
    }
  });

  app.put("/api/loai-van-ban-phap-ly/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLoaiVanBanPhapLySchema.parse(req.body);
      const [updated] = await db
        .update(schema.loaiVanBanPhapLy)
        .set(validatedData)
        .where(eq(schema.loaiVanBanPhapLy.id, Number(id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating loai van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật" });
    }
  });

  app.delete("/api/loai-van-ban-phap-ly/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(schema.loaiVanBanPhapLy)
        .where(eq(schema.loaiVanBanPhapLy.id, Number(id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(deleted);
    } catch (error) {
      console.error("Error deleting loai van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi xóa" });
    }
  });

  // Văn bản pháp lý routes
  app.get("/api/van-ban-phap-ly", async (req, res) => {
    const { hopDongId, search } = req.query;
    try {
      if (search) {
        const keyword = `%${search}%`;
        const items = await db
          .select({
            vanBan: schema.vanBanPhapLy,
            hopDong: schema.hopDong
          })
          .from(schema.vanBanPhapLy)
          .leftJoin(schema.hopDong, eq(schema.vanBanPhapLy.hopDongId, schema.hopDong.id))
          .where(
            sql`LOWER(${schema.hopDong.soHdNgoai}) LIKE LOWER(${keyword}) OR LOWER(${schema.hopDong.soHdNoi}) LIKE LOWER(${keyword}) OR LOWER(${schema.vanBanPhapLy.tenVanBan}) LIKE LOWER(${keyword})`
          );
        return res.json(items.map(i => ({ ...i.vanBan, hopDong: i.hopDong })));
      }

      let query = db.select().from(schema.vanBanPhapLy).$dynamic();
      if (hopDongId) {
        query = query.where(eq(schema.vanBanPhapLy.hopDongId, Number(hopDongId)));
      }

      const items = await query;
      res.json(items);
    } catch (error) {
      console.error("Error fetching van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách văn bản" });
    }
  });

  app.post("/api/van-ban-phap-ly", async (req, res) => {
    try {
      const validatedData = insertVanBanPhapLySchema.parse(req.body);
      const [newItem] = await db
        .insert(schema.vanBanPhapLy)
        .values(validatedData)
        .returning();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi tạo văn bản" });
    }
  });

  app.put("/api/van-ban-phap-ly/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertVanBanPhapLySchema.parse(req.body);
      const [updated] = await db
        .update(schema.vanBanPhapLy)
        .set(validatedData)
        .where(eq(schema.vanBanPhapLy.id, Number(id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật văn bản" });
    }
  });

  app.delete("/api/van-ban-phap-ly/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(schema.vanBanPhapLy)
        .where(eq(schema.vanBanPhapLy.id, Number(id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(deleted);
    } catch (error) {
      console.error("Error deleting van ban phap ly:", error);
      res.status(500).json({ error: "Lỗi khi xóa văn bản" });
    }
  });

  // Loại đoàn ra đoàn vào routes
  app.get("/api/loai-doan-ra-vao", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiDoanRaVao);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai doan ra vao:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/loai-doan-ra-vao", async (req, res) => {
    try {
      const validatedData = insertLoaiDoanRaVaoSchema.parse(req.body);
      const [newItem] = await db
        .insert(schema.loaiDoanRaVao)
        .values(validatedData)
        .returning();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating loai doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi tạo loại đoàn" });
    }
  });

  app.put("/api/loai-doan-ra-vao/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLoaiDoanRaVaoSchema.parse(req.body);
      const [updated] = await db
        .update(schema.loaiDoanRaVao)
        .set(validatedData)
        .where(eq(schema.loaiDoanRaVao.id, Number(id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating loai doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật" });
    }
  });

  app.delete("/api/loai-doan-ra-vao/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(schema.loaiDoanRaVao)
        .where(eq(schema.loaiDoanRaVao.id, Number(id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(deleted);
    } catch (error) {
      console.error("Error deleting loai doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi xóa" });
    }
  });

  // Đoàn ra đoàn vào routes
  app.get("/api/doan-ra-vao", async (req, res) => {
    const { hopDongId, search } = req.query;
    try {
      if (search) {
        const keyword = `%${search}%`;
        const items = await db
          .select({
            doan: schema.doanRaVao,
            hopDong: schema.hopDong
          })
          .from(schema.doanRaVao)
          .leftJoin(schema.hopDong, eq(schema.doanRaVao.hopDongId, schema.hopDong.id))
          .where(
            sql`LOWER(${schema.hopDong.soHdNgoai}) LIKE LOWER(${keyword}) OR LOWER(${schema.hopDong.soHdNoi}) LIKE LOWER(${keyword}) OR LOWER(${schema.doanRaVao.tenDoan}) LIKE LOWER(${keyword})`
          );
        return res.json(items.map(i => ({ ...i.doan, hopDong: i.hopDong })));
      }

      let query = db.select().from(schema.doanRaVao).$dynamic();
      if (hopDongId) {
        query = query.where(eq(schema.doanRaVao.hopDongId, Number(hopDongId)));
      }
      const items = await query;
      res.json(items);
    } catch (error) {
      console.error("Error fetching doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách đoàn" });
    }
  });

  app.post("/api/doan-ra-vao", async (req, res) => {
    try {
      const validatedData = insertDoanRaVaoSchema.parse(req.body);
      const [newItem] = await db
        .insert(schema.doanRaVao)
        .values(validatedData)
        .returning();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi tạo đoàn" });
    }
  });

  app.put("/api/doan-ra-vao/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDoanRaVaoSchema.parse(req.body);
      const [updated] = await db
        .update(schema.doanRaVao)
        .set(validatedData)
        .where(eq(schema.doanRaVao.id, Number(id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật đoàn" });
    }
  });

  app.delete("/api/doan-ra-vao/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [deleted] = await db
        .delete(schema.doanRaVao)
        .where(eq(schema.doanRaVao.id, Number(id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Không tìm thấy" });
      res.json(deleted);
    } catch (error) {
      console.error("Error deleting doan ra vao:", error);
      res.status(500).json({ error: "Lỗi khi xóa đoàn" });
    }
  });

  app.put("/api/hop-dong/:id", async (req, res) => {
    const id = req.params.id;
    try {
      // Validate dữ liệu đầu vào (nếu cần chỉnh sửa thì dùng schema riêng)
      const validatedData = insertHopDongSchema.parse(req.body);
      console.log("Validated Data:", validatedData);
      const updated = await db
        .update(schema.hopDong)
        .set(validatedData)
        .where(eq(schema.hopDong.id, Number(id))) // Convert string id to number
        .returning();
      if (updated.length === 0) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy hợp đồng để cập nhật" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating hop dong:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật hợp đồng" });
    }
  });

  app.delete("/api/hop-dong/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const deleted = await db
        .delete(schema.hopDong)
        .where(eq(schema.hopDong.id, Number(id))) // hoặc Number(id) nếu id là số
        .returning();

      if (deleted.length === 0) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy hợp đồng để xóa" });
      }

      res.json({ message: "Đã xóa hợp đồng thành công", item: deleted[0] });
    } catch (error) {
      console.error("Error deleting hop dong:", error);
      res.status(500).json({ error: "Lỗi khi xóa hợp đồng" });
    }
  });

  // Thanh toán routes
  app.get("/api/thanh-toan", async (req, res) => {
    try {
      const items = await db.select().from(schema.thanhToan);
      res.json(items);
    } catch (error) {
      console.error("Error fetching thanh toan:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/thanh-toan", async (req, res) => {
    try {
      const validatedData = insertThanhToanSchema.parse(req.body);
      const items = await db
        .insert(schema.thanhToan)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating thanh toan:", error);
      res.status(500).json({ error: "Lỗi khi tạo thanh toán" });
    }
  });
  // PUT: Cập nhật thanh toán
  app.put("/api/thanh-toan/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertThanhToanSchema.parse(req.body);

      const updated = await db
        .update(schema.thanhToan)
        .set(validatedData)
        .where(eq(schema.thanhToan.id, Number(id)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy thanh toán" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating thanh toan:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật thanh toán" });
    }
  });

  // DELETE: Xóa thanh toán
  app.delete("/api/thanh-toan/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await db
        .delete(schema.thanhToan)
        .where(eq(schema.thanhToan.id, Number(id)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy thanh toán" });
      }

      res.json({ message: "Đã xóa thành công", data: deleted[0] });
    } catch (error) {
      console.error("Error deleting thanh toan:", error);
      res.status(500).json({ error: "Lỗi khi xóa thanh toán" });
    }
  });

  // Bước thực hiện routes
  app.get("/api/buoc-thuc-hien", async (req, res) => {
    try {
      const items = await db.select().from(schema.buocThucHien);
      res.json(items);
    } catch (error) {
      console.error("Error fetching buoc thuc hien:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/buoc-thuc-hien", async (req, res) => {
    try {
      const validatedData = insertBuocThucHienSchema.parse(req.body);
      const items = await db
        .insert(schema.buocThucHien)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating buoc thuc hien:", error);
      res.status(500).json({ error: "Lỗi khi tạo bước thực hiện" });
    }
  });
  // Cập nhật bước thực hiện theo id
  app.put("/api/buoc-thuc-hien/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = schema.updateBuocThucHienSchema.parse(req.body); // cần có schema cho update
      const updated = await db
        .update(schema.buocThucHien)
        .set(validatedData)
        .where(eq(schema.buocThucHien.id, id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy bước thực hiện" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating buoc thuc hien:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật bước thực hiện" });
    }
  });

  // Xóa bước thực hiện theo id
  app.delete("/api/buoc-thuc-hien/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await db
        .delete(schema.buocThucHien)
        .where(eq(schema.buocThucHien.id, id))
        .returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy bước thực hiện" });
      }
      res.json({ message: "Xóa thành công", item: deleted[0] });
    } catch (error) {
      console.error("Error deleting buoc thuc hien:", error);
      res.status(500).json({ error: "Lỗi khi xóa bước thực hiện" });
    }
  });

  // Lấy tất cả bản ghi cấp tiền
  app.get("/api/cap-tien", async (req, res) => {
    try {
      const items = await db.select().from(schema.capTien);
      res.json(items);
    } catch (error) {
      console.error("Error fetching cap tien:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Thêm mới bản ghi cấp tiền
  app.post("/api/cap-tien", async (req, res) => {
    try {
      const validatedData = insertCapTienSchema.parse(req.body);
      const items = await db
        .insert(schema.capTien)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating cap tien:", error);
      res.status(500).json({ error: "Lỗi khi tạo cấp tiền" });
    }
  });

  // Cập nhật bản ghi cấp tiền theo id
  app.put("/api/cap-tien/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCapTienSchema.parse(req.body);
      const updated = await db
        .update(schema.capTien)
        .set(validatedData)
        .where(eq(schema.capTien.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy bản ghi cấp tiền" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating cap tien:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật cấp tiền" });
    }
  });

  // Xóa bản ghi cấp tiền theo id
  app.delete("/api/cap-tien/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await db
        .delete(schema.capTien)
        .where(eq(schema.capTien.id, id))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy bản ghi cấp tiền" });
      }

      res.json({ message: "Xóa thành công", item: deleted[0] });
    } catch (error) {
      console.error("Error deleting cap tien:", error);
      res.status(500).json({ error: "Lỗi khi xóa cấp tiền" });
    }
  });

  // --- DATABASE BACKUP & RESTORE ---

  // Backup Database
  app.get("/api/backup", (req, res) => {
    try {
      const dbPath = path.resolve(process.cwd(), "database.sqlite");
      if (fs.existsSync(dbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup-contract-management-${timestamp}.sqlite`;
        res.download(dbPath, filename, (err) => {
          if (err) {
            console.error("Error downloading backup:", err);
            // Cannot send error JSON if headers already sent, but try/catch wraps it
          }
        });
      } else {
        res.status(404).json({ error: "Database file not found" });
      }
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ error: "System error during backup" });
    }
  });

  // Restore Database
  app.post("/api/restore", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Vui lòng chọn file backup để khôi phục" });
      }

      // Validate file extension/type if possible (Check magic numbers or assume .sqlite)
      if (!req.file.originalname.endsWith(".sqlite") && !req.file.originalname.endsWith(".db")) {
        // return res.status(400).json({ error: "Định dạng file không hợp lệ. Vui lòng chọn file .sqlite" });
        // Removing strict check for flexibility, but keeping it in mind.
      }

      const dbPath = path.resolve(process.cwd(), "database.sqlite");

      // Safety: Backup existing DB before overwriting
      if (fs.existsSync(dbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = `${dbPath}.auto-backup-${timestamp}.bak`;
        fs.copyFileSync(dbPath, backupPath);
        console.log(`Auto-backup created at ${backupPath}`);
      }

      // Write new DB content
      // Note: writing to an open DB file on Windows might fail or cause corruption if locked.
      // Ideally, the app should stop DB connections. 
      // Since 'better-sqlite3' runs in-process, we might need to rely on OS handling or restart.
      // For this implementation, we try direct overwrite.

      try {
        fs.writeFileSync(dbPath, req.file.buffer);
      } catch (writeErr) {
        console.error("Error writing database file:", writeErr);
        return res.status(500).json({ error: "Không thể ghi đè file cơ sở dữ liệu. File có thể đang bị khóa." });
      }

      res.json({ message: "Khôi phục dữ liệu thành công. Vui lòng tải lại trang." });

    } catch (error) {
      console.error("Error restoring database:", error);
      res.status(500).json({ error: "Lỗi hệ thống khi khôi phục dữ liệu" });
    }
  }); app.put("/api/cap-tien/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateCapTienSchema.parse(req.body);
      const updated = await db
        .update(schema.capTien)
        .set(validatedData)
        .where(eq(schema.capTien.id, id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy cấp tiền" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating cap tien:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật cấp tiền" });
    }
  });

  // Xóa bản ghi cấp tiền theo id
  app.delete("/api/cap-tien/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await db
        .delete(schema.capTien)
        .where(eq(schema.capTien.id, id))
        .returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy cấp tiền" });
      }
      res.json({ message: "Xóa thành công", item: deleted[0] });
    } catch (error) {
      console.error("Error deleting cap tien:", error);
      res.status(500).json({ error: "Lỗi khi xóa cấp tiền" });
    }
  });

  // Trang bị routes
  app.get("/api/trang-bi", async (req, res) => {
    try {
      const items = await db.select().from(schema.trangBi);
      res.json(items);
    } catch (error) {
      console.error("Error fetching trang bi:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/trang-bi", async (req, res) => {
    try {
      const validatedData = insertTrangBiSchema.parse(req.body);
      const items = await db
        .insert(schema.trangBi)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating trang bi:", error);
      res.status(500).json({ error: "Lỗi khi tạo trang bị" });
    }
  });
  // Cập nhật trang bị
  app.put("/api/trang-bi/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTrangBiSchema.parse(req.body); // có thể dùng updateSchema nếu có
      const updated = await db
        .update(schema.trangBi)
        .set(validatedData)
        .where(eq(schema.trangBi.id, Number(id)))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy trang bị" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating trang bi:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật trang bị" });
    }
  });

  // Xóa trang bị
  app.delete("/api/trang-bi/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db
        .delete(schema.trangBi)
        .where(eq(schema.trangBi.id, Number(id)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy trang bị" });
      }

      res.json({ message: "Đã xóa thành công", data: deleted[0] });
    } catch (error) {
      console.error("Error deleting trang bi:", error);
      res.status(500).json({ error: "Lỗi khi xóa trang bị" });
    }
  });
  // File hợp đồng routes
  app.get("/api/file-hop-dong", async (req, res) => {
    try {
      const items = await db.select().from(schema.fileHopDong);
      res.json(items);
    } catch (error) {
      console.error("Error fetching file hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.get("/api/file-hop-dong/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db
        .select()
        .from(schema.fileHopDong)
        .where(eq(schema.fileHopDong.id, id));
      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tài liệu" });
      }
      res.json(items[0]);
    } catch (error) {
      console.error("Error fetching file hop dong by id:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });
  const toInt = (val: any, fallback = 0) =>
    isNaN(parseInt(val)) ? fallback : parseInt(val);
  app.post("/api/file-hop-dong", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;

      // Trường hợp 1: Có file upload (multipart/form-data)
      if (file) {
        const {
          tenFile,
          loaiFile,
          hopDongId,
          nguoiTaiLen,
          ghiChu,
          soVanBan,
          ngayThucHien,
          duongDan,
        } = req.body;

        const parsedData = insertFileHopDongSchema.parse({
          tenFile: tenFile || file.originalname,
          loaiFile: loaiFile || file.mimetype,
          kichThuoc: file.size,
          hopDongId: toInt(hopDongId),
          nguoiTaiLen: nguoiTaiLen ? toInt(nguoiTaiLen) : undefined,
          ghiChu,
          ngayThucHien,
          soVanBan,
          duongDan: duongDan || null,
        });

        const base64FileContent = file.buffer.toString("base64");

        const items = await db
          .insert(schema.fileHopDong)
          .values({
            ...parsedData,
            noiDungFile: `data:${file.mimetype};base64,${base64FileContent}`,
            ngayTaiLen: new Date().toISOString(),
          })
          .returning();

        return res.status(201).json(items[0]);
      }

      // Trường hợp 2: JSON request (không có file, chỉ lưu metadata/đường dẫn)
      const body = req.body;
      const isJson =
        req.headers["content-type"]?.includes("application/json");

      if (isJson || (body && body.hopDongId !== undefined)) {
        const parsedData = insertFileHopDongSchema.parse({
          tenFile: body.tenFile || "",
          loaiFile: body.loaiFile || "",
          kichThuoc: body.kichThuoc ? Number(body.kichThuoc) : 0,
          hopDongId: Number(body.hopDongId ?? 0),
          nguoiTaiLen: body.nguoiTaiLen
            ? Number(body.nguoiTaiLen)
            : undefined,
          ghiChu: body.ghiChu || "",
          ngayThucHien: body.ngayThucHien || "",
          soVanBan: body.soVanBan || "",
          duongDan: body.duongDan || "",
        });

        const items = await db
          .insert(schema.fileHopDong)
          .values({
            ...parsedData,
            noiDungFile: body.noiDungFile || null,
            ngayTaiLen: new Date().toISOString(),
          })
          .returning();

        return res.status(201).json(items[0]);
      }

      return res.status(400).json({ error: "Không có file hoặc dữ liệu hợp lệ" });
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(500).json({ error: "Lỗi khi tạo tài liệu" });
    }
  });


  app.put("/api/file-hop-dong/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFileHopDongSchema.partial().parse(req.body);
      const items = await db
        .update(schema.fileHopDong)
        .set(validatedData)
        .where(eq(schema.fileHopDong.id, id))
        .returning();

      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tài liệu" });
      }

      res.json(items[0]);
    } catch (error) {
      console.error("Error updating file hop dong:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật tài liệu" });
    }
  });

  app.delete("/api/file-hop-dong/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db
        .delete(schema.fileHopDong)
        .where(eq(schema.fileHopDong.id, id))
        .returning();

      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tài liệu" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Lỗi khi xóa tài liệu" });
    }
  });

  app.get("/api/file-hop-dong/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db
        .select()
        .from(schema.fileHopDong)
        .where(eq(schema.fileHopDong.id, id));

      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tài liệu" });
      }

      const document = items[0];

      if (!document.noiDungFile) {
        return res.status(404).json({ error: "File không tồn tại" });
      }

      // Extract base64 content from data URL
      const base64Content = document.noiDungFile.split(",")[1];
      const buffer = Buffer.from(base64Content, "base64");

      // Set appropriate headers
      res.setHeader(
        "Content-Type",
        document.loaiFile || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.tenFile}"`
      );
      res.setHeader("Content-Length", buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Lỗi khi tải file" });
    }
  });

  // Loại trang bị
  app.get("/api/loai-trang-bi", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiTrangBi);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai trang bi:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Loại thanh toán
  app.get("/api/loai-thanh-toan", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiThanhToan);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai thanh toan:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Loại hình thức thanh toán
  app.get("/api/loai-hinh-thuc-thanh-toan", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiHinhThucThanhToan);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai hinh thuc thanh toan:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Địa điểm thông quan routes
  app.get("/api/dia-diem-thong-quan", async (req, res) => {
    try {
      const items = await db.select().from(schema.diaDiemThongQuan);
      res.json(items);
    } catch (error) {
      console.error("Error fetching dia diem thong quan:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/dia-diem-thong-quan", async (req, res) => {
    console.log("Received request body:", req.body);
    try {
      const validatedData = insertDiaDiemThongQuanSchema.parse(req.body);
      console.log("Validated Data:", validatedData);
      const items = await db
        .insert(schema.diaDiemThongQuan)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating dia diem thong quan:", error);
      res.status(500).json({ error: "Lỗi khi tạo địa điểm thông quan" });
    }
  });
  app.put("/api/dia-diem-thong-quan/:id", async (req, res) => {
    const id = req.params.id;

    try {
      // Validate dữ liệu gửi lên
      const validatedData = insertDiaDiemThongQuanSchema.parse(req.body);

      const updated = await db
        .update(schema.diaDiemThongQuan)
        .set(validatedData)
        .where(eq(schema.diaDiemThongQuan.id, Number(id)))
        .returning();

      if (updated.length === 0) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy địa điểm để cập nhật" });
      }

      res.json({ message: "Cập nhật thành công", item: updated[0] });
    } catch (error) {
      console.error("Error updating dia diem thong quan:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật địa điểm thông quan" });
    }
  });
  app.delete("/api/dia-diem-thong-quan/:id", async (req, res) => {
    const id = req.params.id;

    try {
      const deleted = await db
        .delete(schema.diaDiemThongQuan)
        .where(eq(schema.diaDiemThongQuan.id, Number(id)))
        .returning();

      if (deleted.length === 0) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy địa điểm để xóa" });
      }

      res.json({ message: "Xóa thành công", item: deleted[0] });
    } catch (error) {
      console.error("Error deleting dia diem thong quan:", error);
      res.status(500).json({ error: "Lỗi khi xóa địa điểm thông quan" });
    }
  });

  // Tiếp nhận routes
  app.get("/api/tiep-nhan", async (req, res) => {
    try {
      const items = await db.select().from(schema.tiepNhan);
      res.json(items);
    } catch (error) {
      console.error("Error fetching tiep nhan:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.get("/api/tiep-nhan/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db
        .select()
        .from(schema.tiepNhan)
        .where(eq(schema.tiepNhan.id, id));
      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tiếp nhận" });
      }
      res.json(items[0]);
    } catch (error) {
      console.error("Error fetching tiep nhan by id:", error);
      res.status(500).json({ error: "Lỗi khi lấy tiếp nhận" });
    }
  });

  app.get("/api/tiep-nhan/hop-dong/:hopDongId", async (req, res) => {
    try {
      const hopDongId = parseInt(req.params.hopDongId);
      const items = await db
        .select()
        .from(schema.tiepNhan)
        .where(eq(schema.tiepNhan.hopDongId, hopDongId));
      res.json(items);
    } catch (error) {
      console.error("Error fetching tiep nhan by hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/tiep-nhan", async (req, res) => {
    try {
      const validatedData = insertTiepNhanSchema.parse(req.body);
      const items = await db
        .insert(schema.tiepNhan)
        .values(validatedData)
        .returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating tiep nhan:", error);
      res.status(500).json({ error: "Lỗi khi tạo tiếp nhận" });
    }
  });

  app.put("/api/tiep-nhan/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTiepNhanSchema.partial().parse(req.body);
      const items = await db
        .update(schema.tiepNhan)
        .set(validatedData)
        .where(eq(schema.tiepNhan.id, id))
        .returning();
      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tiếp nhận" });
      }
      res.json(items[0]);
    } catch (error) {
      console.error("Error updating tiep nhan:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật tiếp nhận" });
    }
  });

  app.delete("/api/tiep-nhan/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db
        .delete(schema.tiepNhan)
        .where(eq(schema.tiepNhan.id, id))
        .returning();
      if (items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy tiếp nhận" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tiep nhan:", error);
      res.status(500).json({ error: "Lỗi khi xóa tiếp nhận" });
    }
  });
  // Điều kiện giao hàng
  app.get("/api/dieu-kien-giao-hang", async (req, res) => {
    try {
      const items = await db.select().from(schema.dieuKienGiaoHang);
      res.json(items);
    } catch (error) {
      console.error("Error fetching incoterm:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });
  // File: server/index.ts hoặc server/api/export.ts (tuỳ vào cấu trúc dự án bạn)

  app.get("/api/export/hop-dong", async (req, res) => {
    try {
      const rows = await db
        .select({
          hopDong: {
            id: schema.hopDong.id,
            ten: schema.hopDong.ten,
            soHdNoi: schema.hopDong.soHdNoi,
            soHdNgoai: schema.hopDong.soHdNgoai,
            ngay: schema.hopDong.ngay,
            giaTriHopDong: schema.hopDong.giaTriHopDong,
            moTa: schema.hopDong.moTa,
            phiUyThac: schema.hopDong.phiUyThac,
            tyGia: schema.hopDong.tyGia,
          },
          canBo: {
            ten: schema.canBo.ten,
            email: schema.canBo.email,
          },
          nhaCungCap: {
            ten: schema.nhaCungCap.ten,
            diaChi: schema.nhaCungCap.diaChi,
            soDienThoai: schema.nhaCungCap.soDienThoai,
          },
          chuDauTu: {
            ten: schema.chuDauTu.ten,
          },
          capTien: schema.capTien,
          baoLanh: schema.baoLanh,
          thuTinDung: schema.thuTinDung,
        })
        .from(schema.hopDong)
        .leftJoin(schema.canBo, eq(schema.hopDong.canBoId, schema.canBo.id))
        .leftJoin(
          schema.nhaCungCap,
          eq(schema.hopDong.nhaCungCapId, schema.nhaCungCap.id)
        )
        .leftJoin(
          schema.chuDauTu,
          eq(schema.hopDong.chuDauTuId, schema.chuDauTu.id)
        )
        .leftJoin(
          schema.capTien,
          eq(schema.capTien.hopDongId, schema.hopDong.id)
        )
        .leftJoin(
          schema.baoLanh,
          eq(schema.baoLanh.hopDongId, schema.hopDong.id)
        )
        .leftJoin(
          schema.thuTinDung,
          eq(schema.thuTinDung.hopDongId, schema.hopDong.id)
        );

      // Gom các bản ghi vào từng hợp đồng, loại bỏ trùng lặp
      const result = Object.values(
        rows.reduce((acc: any, row: any) => {
          const hdId = row.hopDong.id;
          if (!acc[hdId]) {
            acc[hdId] = {
              hopDong: row.hopDong,
              canBo: row.canBo,
              nhaCungCap: row.nhaCungCap,
              chuDauTu: row.chuDauTu,
              capTien: [],
              baoLanh: [],
              thuTinDung: [],
            };
          }

          if (row.capTien?.id && !acc[hdId].capTien.some((i: any) => i.id === row.capTien.id)) {
            acc[hdId].capTien.push(row.capTien);
          }
          if (row.baoLanh?.id && !acc[hdId].baoLanh.some((i: any) => i.id === row.baoLanh.id)) {
            acc[hdId].baoLanh.push(row.baoLanh);
          }
          if (row.thuTinDung?.id && !acc[hdId].thuTinDung.some((i: any) => i.id === row.thuTinDung.id)) {
            acc[hdId].thuTinDung.push(row.thuTinDung);
          }

          return acc;
        }, {})
      );

      res.json(result);
    } catch (error) {
      console.error("Export hop dong error:", error);
      res.status(500).json({ error: "Lỗi server khi export hợp đồng" });
    }
  });

  // Loại bảo lãnh
  app.get("/api/loai-bao-lanh", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiBaoLanh);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai bao lanh:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/loai-bao-lanh", async (req, res) => {
    try {
      const validatedData = insertLoaiBaoLanhSchema.parse(req.body);
      const items = await db.insert(schema.loaiBaoLanh).values(validatedData).returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating loai bao lanh:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Bảo lãnh
  app.get("/api/bao-lanh", async (req, res) => {
    try {
      const items = await db.select().from(schema.baoLanh);
      res.json(items);
    } catch (error) {
      console.error("Error fetching bao lanh:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/bao-lanh", async (req, res) => {
    try {
      const validatedData = insertBaoLanhSchema.parse(req.body);
      const items = await db.insert(schema.baoLanh).values(validatedData).returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating bao lanh:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.put("/api/bao-lanh/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBaoLanhSchema.partial().parse(req.body);
      const items = await db
        .update(schema.baoLanh)
        .set(validatedData)
        .where(eq(schema.baoLanh.id, id))
        .returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(items[0]);
    } catch (error) {
      console.error("Error updating bao lanh:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.delete("/api/bao-lanh/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db.delete(schema.baoLanh).where(eq(schema.baoLanh.id, id)).returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bao lanh:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Thư tín dụng
  app.get("/api/thu-tin-dung", async (req, res) => {
    try {
      const items = await db.select().from(schema.thuTinDung);
      res.json(items);
    } catch (error) {
      console.error("Error fetching thu tin dung:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/thu-tin-dung", async (req, res) => {
    try {
      const validatedData = insertThuTinDungSchema.parse(req.body);
      const items = await db.insert(schema.thuTinDung).values(validatedData).returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating thu tin dung:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.put("/api/thu-tin-dung/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertThuTinDungSchema.partial().parse(req.body);
      const items = await db
        .update(schema.thuTinDung)
        .set(validatedData)
        .where(eq(schema.thuTinDung.id, id))
        .returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(items[0]);
    } catch (error) {
      console.error("Error updating thu tin dung:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.delete("/api/thu-tin-dung/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db.delete(schema.thuTinDung).where(eq(schema.thuTinDung.id, id)).returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting thu tin dung:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Loại chi phí
  app.get("/api/loai-chi-phi", async (req, res) => {
    try {
      const items = await db.select().from(schema.loaiChiPhi);
      res.json(items);
    } catch (error) {
      console.error("Error fetching loai chi phi:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/loai-chi-phi", async (req, res) => {
    try {
      const validatedData = schema.insertLoaiChiPhiSchema.parse(req.body);
      const items = await db.insert(schema.loaiChiPhi).values(validatedData).returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating loai chi phi:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.put("/api/loai-chi-phi/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = schema.insertLoaiChiPhiSchema.partial().parse(req.body);
      const items = await db
        .update(schema.loaiChiPhi)
        .set(validatedData)
        .where(eq(schema.loaiChiPhi.id, id))
        .returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(items[0]);
    } catch (error) {
      console.error("Error updating loai chi phi:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.delete("/api/loai-chi-phi/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db.delete(schema.loaiChiPhi).where(eq(schema.loaiChiPhi.id, id)).returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting loai chi phi:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Chi phí thực tế
  app.get("/api/chi-phi-thuc-te", async (req, res) => {
    try {
      const items = await db.select().from(schema.chiPhiThucTe);
      res.json(items);
    } catch (error) {
      console.error("Error fetching chi phi thuc te:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/chi-phi-thuc-te", async (req, res) => {
    try {
      const validatedData = schema.insertChiPhiThucTeSchema.parse(req.body);
      const items = await db.insert(schema.chiPhiThucTe).values(validatedData).returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating chi phi thuc te:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.put("/api/chi-phi-thuc-te/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = schema.insertChiPhiThucTeSchema.partial().parse(req.body);
      const items = await db
        .update(schema.chiPhiThucTe)
        .set(validatedData)
        .where(eq(schema.chiPhiThucTe.id, id))
        .returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(items[0]);
    } catch (error) {
      console.error("Error updating chi phi thuc te:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.delete("/api/chi-phi-thuc-te/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db.delete(schema.chiPhiThucTe).where(eq(schema.chiPhiThucTe.id, id)).returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting chi phi thuc te:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  // Chi phí theo hợp đồng
  app.get("/api/chi-phi-theo-hop-dong", async (req, res) => {
    try {
      const items = await db.select().from(schema.chiPhiTheoHopDong);
      res.json(items);
    } catch (error) {
      console.error("Error fetching chi phi theo hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.post("/api/chi-phi-theo-hop-dong", async (req, res) => {
    try {
      const validatedData = schema.insertChiPhiTheoHopDongSchema.parse(req.body);
      const items = await db.insert(schema.chiPhiTheoHopDong).values(validatedData).returning();
      res.status(201).json(items[0]);
    } catch (error) {
      console.error("Error creating chi phi theo hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.put("/api/chi-phi-theo-hop-dong/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = schema.insertChiPhiTheoHopDongSchema.partial().parse(req.body);
      const items = await db
        .update(schema.chiPhiTheoHopDong)
        .set(validatedData)
        .where(eq(schema.chiPhiTheoHopDong.id, id))
        .returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(items[0]);
    } catch (error) {
      console.error("Error updating chi phi theo hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });

  app.delete("/api/chi-phi-theo-hop-dong/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await db.delete(schema.chiPhiTheoHopDong).where(eq(schema.chiPhiTheoHopDong.id, id)).returning();
      if (items.length === 0) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting chi phi theo hop dong:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });
}
