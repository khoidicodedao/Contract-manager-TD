import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { LucideIcon, Search, Settings as SettingsIcon } from "lucide-react";
import { useSearchContracts } from "@/hooks/use-search-contracts";
import { Link } from "wouter";
import NotificationBell from "./notification-bell";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  onCreateContract?: () => void;
}

export default function Header({
  title,
  subtitle,
  icon: Icon,
  onCreateContract,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: results, isLoading } = useSearchContracts(debouncedSearch);

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  // Debounce input (300ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative w-80">
            <Input
              type="search"
              placeholder="Tìm kiếm hợp đồng..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />

            {/* Dropdown search results */}
            {debouncedSearch && (
              <div className="absolute top-full mt-1 w-full bg-white border rounded shadow z-50 max-h-60 overflow-auto">
                {isLoading ? (
                  <div className="p-2 text-sm text-gray-500">
                    Đang tìm kiếm...
                  </div>
                ) : results && results.length > 0 ? (
                  results.map((contract: any) => (
                    <div
                      key={contract.id}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                      onClick={() => setSearchTerm("")}
                    >
                      <Link to={`/hop-dong?search=${contract.ten}`}>
                        {contract.ten}
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">
                    Không tìm thấy hợp đồng
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🔔 Notification Bell */}
          <NotificationBell />

          {/* User profile */}
          <Link href="/cai-dat">
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 cursor-pointer group hover:bg-slate-50 transition-colors py-1 rounded-md px-2">
              <img
                src={settings.USER_PHOTO || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128"}
                alt="Avatar người dùng"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200"
              />
              <div className="min-w-0 max-w-[150px]">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {settings.USER_NAME || "Người dùng"}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-semibold">
                  {settings.USER_ROLE || "Thành viên"}
                </p>
              </div>
              <SettingsIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors ml-1" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export { Header };
