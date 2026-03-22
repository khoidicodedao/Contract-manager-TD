import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./database";
import { users, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logAction } from "./audit";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, buf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: false, // set to true if using https
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, role, phongBanId } = req.body;
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(password);
      const [user] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          role: role || "assistant",
          phongBanId: phongBanId || null,
        })
        .returning();

      req.login(user, async (err) => {
        if (err) return next(err);
        await logAction(req, "register", "tài_khoản", user.id, `Đăng ký tài khoản mới: ${user.username}`);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).send("Invalid username or password");
      req.login(user, async (err) => {
        if (err) return next(err);
        await logAction(req, "login", "hệ_thống", user.id, `Người dùng ${user.username} đăng nhập`);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    if (req.user) {
      await logAction(req, "logout", "hệ_thống", (req.user as User).id, `Người dùng ${(req.user as User).username} đăng xuất`);
    }
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
