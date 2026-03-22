import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { log } from "./vite"; // ✅ log không gây lỗi, chỉ là hàm helper
import { db } from "./database";
import { auditLogs } from "@shared/schema";

export async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Middleware log request/response
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        log(logLine);
        
        // Auto Audit Logging for generic routes
        const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        const user = (req as any).user;
        const isAudited = (req as any).audited;

        if (isMutation && isSuccess && user && !isAudited) {
          try {
            const actionMap: Record<string, string> = { POST: "create", PUT: "update", DELETE: "delete", PATCH: "update" };
            const action = actionMap[req.method] || req.method.toLowerCase();
            
            const urlPath = req.path.replace("/api/", "");
            const parts = urlPath.split("/");
            let targetType = parts[0];
            let targetId = null;

            if (parts.length > 1 && !isNaN(Number(parts[1]))) {
              targetId = Number(parts[1]);
            } else if (capturedJsonResponse) {
              if (capturedJsonResponse.id) targetId = capturedJsonResponse.id;
              else if (Array.isArray(capturedJsonResponse) && capturedJsonResponse[0]?.id) {
                targetId = capturedJsonResponse[0].id;
              }
            }

            // Exclude already handled authentication endpoints
            if (targetType !== "login" && targetType !== "logout" && targetType !== "register" && targetType !== "user") {
              const actionLabels: Record<string, string> = { create: "Tạo mới", update: "Cập nhật", delete: "Xóa" };
              const details = `${actionLabels[action] || action} bản ghi thuộc ${targetType.replace(/-/g, ' ')}`;
              
              db.insert(auditLogs).values({
                userId: user.id,
                action,
                targetType,
                targetId: targetId || null,
                details,
                timestamp: new Date().toISOString()
              }).catch((e: any) => console.error("Lỗi auto audit:", e));
            }
          } catch (e) {
            console.error("Lỗi logic auto audit:", e);
          }
        }
      }
    });

    next();
  });

  // Cấu hình xác thực
  const { setupAuth } = await import("./auth");
  setupAuth(app);

  // Đăng ký route
  await registerRoutes(app);

  // Middleware bắt lỗi
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Phục vụ giao diện

  const { serveStatic } = await import("./vite.js"); // ✅ an toàn trong production
  serveStatic(app);

  // Chạy server
  const port = 5000;
  await new Promise<void>((resolve) => {
    server.listen(port, "0.0.0.0", async () => {
      log(`✅ Server running at http://localhost:${port}`);

      try {
        const { initializeDatabase } = await import("./database");
        await initializeDatabase();
      } catch (error) {
        console.log("Note: Could not initialize database:", error);
      }

      resolve();
    });
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
