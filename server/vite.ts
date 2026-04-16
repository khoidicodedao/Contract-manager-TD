import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  log(`Looking for static files in ${distPath}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run "npm run build" from the project root before "npm start".`
    );
  }

  app.use(express.static(distPath));
  log("Static files are being served.");

  app.use("*", (req, res) => {
    log(`[Static] Serving index.html for ${req.originalUrl}`);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}