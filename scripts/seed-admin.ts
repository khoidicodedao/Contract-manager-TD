import { db } from "../server/database";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    const username = "admin";
    const password = "admin";
    
    // Kiểm tra xem đã tồn tại chưa
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser) {
      const hashedPassword = await hashPassword(password);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "admin",
          phongBanId: null,
        })
        .where(eq(users.username, username));

      console.log(`Da reset mat khau cho tai khoan ${username}`);
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      console.log(`Tài khoản ${username} đã tồn tại với ID: ${existingUser.id}`);
      process.exit(0);
    }

    const hashedPassword = await hashPassword(password);
    
    const [user] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        role: "admin", // Quyền cao nhất
        phongBanId: null, // Admin không cần gắn phòng ban
      })
      .returning();

    console.log(`Đã tạo thành công tài khoản admin!`);
    console.log(`Username: ${user.username}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản:", error);
    process.exit(1);
  }
}

createAdmin();
