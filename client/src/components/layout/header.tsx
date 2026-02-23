import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchContracts } from "@/hooks/use-search-contracts";
import { Link } from "wouter";
import NotificationBell from "./notification-bell";

interface HeaderProps {
  title: string;
  subtitle: string;
  onCreateContract?: () => void;
}

export default function Header({
  title,
  subtitle,
  onCreateContract,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: results, isLoading } = useSearchContracts(debouncedSearch);

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
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
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
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"
              alt="Avatar người dùng"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                Quản trị viên
              </p>
              <p className="text-xs text-slate-500 truncate">
                Quản lý dự án / Vaxuco
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
