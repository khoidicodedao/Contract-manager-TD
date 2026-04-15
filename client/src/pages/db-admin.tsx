import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, Edit, Plus, Search, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ColumnMeta = {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
};

type TableMeta = {
  name: string;
  primaryKey: string | null;
  rowCount: number;
  columns: ColumnMeta[];
};

type TableRowsResponse = {
  table: TableMeta;
  rows: Record<string, unknown>[];
};

function normalizeValueByType(value: string, column: ColumnMeta) {
  if (value === "") return null;

  const type = column.type.toUpperCase();
  if (type.includes("INT")) return Number(value);
  if (type.includes("REAL") || type.includes("FLOA") || type.includes("DOUB")) {
    return Number(value);
  }

  return value;
}

export default function DbAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTableName, setSelectedTableName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});

  const { data: currentUser } = useQuery<{ role: string }>({
    queryKey: ["/api/user"],
  });

  const {
    data: tables = [],
    isLoading: isLoadingTables,
    error: tablesError,
  } = useQuery<TableMeta[]>({
    queryKey: ["/api/db-admin/tables"],
  });

  useEffect(() => {
    if (!selectedTableName && tables.length > 0) {
      setSelectedTableName(tables[0].name);
    }
  }, [tables, selectedTableName]);

  const selectedTable = useMemo(
    () => tables.find((table) => table.name === selectedTableName) ?? null,
    [tables, selectedTableName]
  );

  const { data: rowsResponse, isLoading: isLoadingRows } = useQuery<TableRowsResponse>({
    queryKey: ["/api/db-admin/tables", selectedTableName, "rows"],
    queryFn: async () => {
      const res = await fetch(`/api/db-admin/tables/${selectedTableName}/rows`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: Boolean(selectedTableName),
  });

  const rows = rowsResponse?.rows ?? [];

  const visibleRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term)
      )
    );
  }, [rows, searchTerm]);

  const refreshCurrentTable = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/db-admin/tables"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/db-admin/tables", selectedTableName, "rows"],
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiRequest("POST", `/api/db-admin/tables/${selectedTableName}/rows`, payload),
    onSuccess: () => {
      refreshCurrentTable();
      setIsDialogOpen(false);
      toast({ title: "Thành công", description: "Đã thêm dòng dữ liệu" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm dữ liệu",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      pk,
      payload,
    }: {
      pk: string;
      payload: Record<string, unknown>;
    }) => apiRequest("PUT", `/api/db-admin/tables/${selectedTableName}/rows/${encodeURIComponent(pk)}`, payload),
    onSuccess: () => {
      refreshCurrentTable();
      setIsDialogOpen(false);
      toast({ title: "Thành công", description: "Đã cập nhật dòng dữ liệu" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật dữ liệu",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pk: string) =>
      apiRequest("DELETE", `/api/db-admin/tables/${selectedTableName}/rows/${encodeURIComponent(pk)}`),
    onSuccess: () => {
      refreshCurrentTable();
      toast({ title: "Thành công", description: "Đã xóa dòng dữ liệu" });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa dữ liệu",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    if (!selectedTable) return;
    const nextState: Record<string, string> = {};
    selectedTable.columns.forEach((column) => {
      if (!column.isPrimaryKey || column.type.toUpperCase() !== "INTEGER") {
        nextState[column.name] = "";
      }
    });
    setEditingRow(null);
    setFormState(nextState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (row: Record<string, unknown>) => {
    if (!selectedTable) return;
    const nextState: Record<string, string> = {};
    selectedTable.columns.forEach((column) => {
      nextState[column.name] = String(row[column.name] ?? "");
    });
    setEditingRow(row);
    setFormState(nextState);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedTable) return;

    const payload: Record<string, unknown> = {};
    selectedTable.columns.forEach((column) => {
      if (editingRow && column.isPrimaryKey) return;
      if (!editingRow && column.isPrimaryKey && column.type.toUpperCase() === "INTEGER") return;
      payload[column.name] = normalizeValueByType(formState[column.name] ?? "", column);
    });

    if (editingRow && selectedTable.primaryKey) {
      updateMutation.mutate({
        pk: String(editingRow[selectedTable.primaryKey] ?? ""),
        payload,
      });
      return;
    }

    createMutation.mutate(payload);
  };

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold">Góc truy cập bị từ chối</h2>
          <p className="text-slate-500 mt-2">Tính năng này chỉ dành cho Quản trị viên</p>
        </div>
      </div>
    );
  }

  const previewColumns = selectedTable?.columns.slice(0, 8) ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Quản lý bảng dữ liệu"
          subtitle="Xem, thêm, sửa, xóa trực tiếp dữ liệu trong các bảng"
          icon={Database}
          onCreateContract={openCreateDialog}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách bảng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingTables ? (
                  <div className="text-sm text-slate-500">Đang tải danh sách bảng...</div>
                ) : tablesError ? (
                  <div className="text-sm text-red-600 whitespace-pre-wrap">
                    {tablesError instanceof Error
                      ? tablesError.message
                      : "Không tải được danh sách bảng."}
                  </div>
                ) : (
                  tables.map((table) => (
                    <button
                      key={table.name}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedTableName === table.name
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        setSelectedTableName(table.name);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-900">{table.name}</span>
                        <Badge variant="secondary">{table.rowCount}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        PK: {table.primaryKey || "Không có"}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>{selectedTable?.name || "Chọn một bảng"}</CardTitle>
                    {selectedTable && (
                      <div className="text-sm text-slate-500 mt-1">
                        {selectedTable.columns.length} cột, {selectedTable.rowCount} dòng
                      </div>
                    )}
                  </div>
                  <Button onClick={openCreateDialog} disabled={!selectedTable}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm dòng
                  </Button>
                </div>
                <div className="relative mt-4 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-10"
                    placeholder="Tìm trong dữ liệu bảng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTable ? (
                  <div className="text-sm text-slate-500">Chưa chọn bảng nào.</div>
                ) : isLoadingRows ? (
                  <div className="text-sm text-slate-500">Đang tải dữ liệu bảng...</div>
                ) : visibleRows.length === 0 ? (
                  <div className="text-sm text-slate-500">Không có dữ liệu phù hợp.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewColumns.map((column) => (
                            <TableHead key={column.name}>{column.name}</TableHead>
                          ))}
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleRows.map((row, index) => {
                          const pkValue = selectedTable.primaryKey
                            ? row[selectedTable.primaryKey]
                            : index;

                          return (
                            <TableRow key={String(pkValue)}>
                              {previewColumns.map((column) => (
                                <TableCell key={column.name} className="max-w-[220px] truncate">
                                  {String(row[column.name] ?? "") || "—"}
                                </TableCell>
                              ))}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(row)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600"
                                    onClick={() => {
                                      if (!selectedTable.primaryKey) return;
                                      if (confirm("Chắc chắn muốn xóa dòng dữ liệu này?")) {
                                        deleteMutation.mutate(String(row[selectedTable.primaryKey] ?? ""));
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRow ? "Cập nhật dòng dữ liệu" : "Thêm dòng dữ liệu"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedTable?.columns
              .filter((column) => !editingRow || !column.isPrimaryKey)
              .filter((column) => editingRow || column.type.toUpperCase() !== "INTEGER" || !column.isPrimaryKey)
              .map((column) => {
                const value = formState[column.name] ?? "";
                const isLongText = value.length > 120 || column.type.toUpperCase().includes("TEXT");

                return (
                  <div key={column.name} className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {column.name}
                      {column.notNull && <span className="text-red-500"> *</span>}
                    </label>
                    {isLongText ? (
                      <Textarea
                        value={value}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, [column.name]: e.target.value }))
                        }
                      />
                    ) : (
                      <Input
                        value={value}
                        type={
                          column.type.toUpperCase().includes("INT") ||
                          column.type.toUpperCase().includes("REAL")
                            ? "number"
                            : "text"
                        }
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, [column.name]: e.target.value }))
                        }
                      />
                    )}
                    <div className="text-xs text-slate-400">
                      {column.type || "TEXT"}
                      {column.defaultValue ? ` | default: ${column.defaultValue}` : ""}
                    </div>
                  </div>
                );
              })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingRow ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
