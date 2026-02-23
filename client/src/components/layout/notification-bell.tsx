import { useRef, useState, useEffect } from "react";
import { Bell, FileText, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── types ───────────────────────────────────────────────────────────────────
interface NotifItem {
    id: string;
    type: "contract" | "payment";
    title: string;
    subtitle: string;
    days: number;
    deadline: string;
    href: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function urgencyClass(days: number) {
    if (days < 0) return "bg-red-50 border-l-4 border-red-500";
    if (days === 0) return "bg-orange-50 border-l-4 border-orange-500";
    if (days <= 3) return "bg-amber-50 border-l-4 border-amber-400";
    return "bg-blue-50 border-l-4 border-blue-300";
}

function urgencyBadge(days: number) {
    if (days < 0) return { label: "Quá hạn", cls: "bg-red-500 text-white" };
    if (days === 0) return { label: "Hôm nay", cls: "bg-orange-500 text-white" };
    if (days <= 3) return { label: `${days} ngày`, cls: "bg-amber-500 text-white" };
    return { label: `${days} ngày`, cls: "bg-blue-500 text-white" };
}

function formatDeadline(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN");
}

// ─── component ───────────────────────────────────────────────────────────────
export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ─── Query: dùng API backend để lấy danh sách thông báo ──────────────────
    const { data: notifications = [] } = useQuery<NotifItem[]>({
        queryKey: ["/api/notifications"],
        refetchInterval: 5 * 60 * 1000, // Refresh mỗi 5 phút
    });

    const total = notifications.length;
    const overdueCount = notifications.filter((n) => n.days < 0).length;

    return (
        <div className="relative" ref={ref}>
            {/* ── Bell button ─────────────────────────────────────────────────── */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
                title={total > 0 ? `${total} thông báo` : "Không có thông báo"}
                aria-label="Thông báo"
            >
                <Bell
                    className={`w-5 h-5 transition-colors ${overdueCount > 0
                            ? "text-red-500"
                            : total > 0
                                ? "text-amber-500"
                                : "text-slate-400"
                        }`}
                />
                {total > 0 && (
                    <span
                        className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full
              text-[10px] font-bold flex items-center justify-center px-1 shadow
              ${overdueCount > 0
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-amber-500 text-white"
                            }`}
                    >
                        {total > 99 ? "99+" : total}
                    </span>
                )}
            </button>

            {/* ── Dropdown ────────────────────────────────────────────────────── */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-slate-800 text-sm">Thông báo hạn mức</span>
                            {total > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs px-2 py-0.5">
                                    {total} mục
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {overdueCount > 0 && (
                                <Badge className="bg-red-100 text-red-700 border-0 text-xs px-2">
                                    ⚠ {overdueCount} quá hạn
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-50">
                        {total === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Bell className="w-7 h-7 opacity-40" />
                                </div>
                                <p className="text-sm font-medium">Không có thông báo nào</p>
                                <p className="text-xs text-slate-300">Tất cả hợp đồng & thanh toán đều trong hạn</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const badge = urgencyBadge(notif.days);
                                return (
                                    <Link key={notif.id} href={notif.href}>
                                        <div
                                            className={`flex items-start gap-3 px-4 py-3.5 hover:brightness-95 cursor-pointer transition-all ${urgencyClass(notif.days)}`}
                                            onClick={() => setOpen(false)}
                                        >
                                            {/* Type icon */}
                                            <div
                                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${notif.type === "contract"
                                                        ? "bg-blue-100"
                                                        : "bg-purple-100"
                                                    }`}
                                            >
                                                {notif.type === "contract" ? (
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <CreditCard className="w-4 h-4 text-purple-600" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                                                        {notif.title}
                                                    </p>
                                                    <span
                                                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${badge.cls}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {notif.subtitle}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    Hạn: {formatDeadline(notif.deadline)}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 flex justify-between items-center">
                        <span className="text-[11px] text-slate-400">
                            📅 Hiển thị mục trong vòng 7 ngày tới
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 text-blue-600 hover:text-blue-800 px-2"
                            onClick={() => setOpen(false)}
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
