import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText, Package, CreditCard, Clock, Globe, BarChart3, TrendingUp, Wallet, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import WorldMap from "@/components/charts/world-map";
import { Progress } from "@/components/ui/progress";
import React from "react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/system/overview"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // 30s
  });

  const { data: chartData, isLoading: isChartsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/charts"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // 30s
  });

  const { data: equipment = [] } = useQuery<any[]>({
    queryKey: ["/api/trang-bi"],
  });
  const { data: equipmentTypes } = useQuery<any[]>({
    queryKey: ["/api/loai-trang-bi"],
  });
  const equipmentChartData = React.useMemo(() => {
    if (!equipment || !equipmentTypes) return [];

    return equipmentTypes.map((type: any) => {
      const count = equipment.filter(
        (eq: any) => eq.loaiTrangBiId === type.id
      ).length;

      return {
        name: type.ten,
        value: count,
      };
    });
  }, [equipment, equipmentTypes]);
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Tổng quan hệ thống"
            subtitle="Theo dõi tình hình tổng thể của các hợp đồng và dự án"
            onCreateContract={() => {}}
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Tổng quan hệ thống"
          subtitle="Theo dõi tình hình tổng thể của các hợp đồng và dự án"
          icon={BarChart3}
          onCreateContract={() => {}}
        />

        <main className="flex-1 overflow-auto p-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/hop-dong">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">
                        Tổng hợp đồng
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {stats?.totalContracts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/hop-dong">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">
                        Đã thanh lý
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {stats?.completedContracts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/hop-dong">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">
                        Chưa thực hiện
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {stats?.pausedContracts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/hop-dong">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">
                        Đang thực hiện
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {stats?.activeContracts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Contract Types Pie Chart */}
            {/* Contract Types Chart (đổi thành BarChart) */}
            <Card>
              <CardHeader>
                <CardTitle>Số lượng hợp đồng theo loại hợp đồng</CardTitle>
              </CardHeader>
              <CardContent>
                {!isChartsLoading && chartData?.contractTypes ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.contractTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6">
                        {chartData.contractTypes.map(
                          (_: any, index: number) => (
                            <Cell
                              key={`cell-contract-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-gray-500">Đang tải biểu đồ...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment Types Chart (đổi thành PieChart) */}
            {/* Equipment Types Chart (PieChart) */}
            <Card>
              <CardHeader>
                <CardTitle>Số lượng trang bị theo loại</CardTitle>
              </CardHeader>
              <CardContent>
                {equipmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={equipmentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          value > 0
                            ? `${name} ${(percent * 100).toFixed(0)}%`
                            : ""
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {equipmentChartData.map((_: any, index: number) => (
                          <Cell
                            key={`cell-eq-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-gray-500">Đang tải biểu đồ...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tình trạng thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                {!isChartsLoading && chartData?.paymentStatus ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.paymentStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#82ca9d"
                        dataKey="value"
                      >
                        {chartData.paymentStatus.map(
                          (_: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[(index + 2) % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-gray-500">Đang tải biểu đồ...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tình trạng tiến độ</CardTitle>
              </CardHeader>
              <CardContent>
                {!isChartsLoading && chartData?.progressStatus ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.progressStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-gray-500">Đang tải biểu đồ...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier Countries Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Nhà cung cấp theo quốc gia</CardTitle>
              </CardHeader>
              <CardContent>
                {!isChartsLoading && chartData?.supplierCountries ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.supplierCountries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-gray-500">Đang tải biểu đồ...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Value Summary - IMPROVED */}
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="border-b bg-white/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    Tình hình thực hiện tài chính
                  </CardTitle>
                  <ArrowUpRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Row 1: Key Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white rounded-xl border shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        HĐ đang chạy
                      </p>
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-slate-900">
                          {stats?.activeContracts || 0}
                        </span>
                        <span className="text-[10px] text-slate-400 mb-0.5">bản</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Tiến độ chung
                      </p>
                      <div className="flex items-end gap-1">
                        <span className="text-xl font-black text-blue-600">
                          {stats?.totalProgressSteps > 0 
                            ? Math.round((stats.completedSteps / stats.totalProgressSteps) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={stats?.totalProgressSteps > 0 ? (stats.completedSteps / stats.totalProgressSteps) * 100 : 0} 
                        className="h-1 mt-1 bg-blue-50"
                      />
                    </div>
                  </div>

                  {/* Row 2: Payment Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                        Tiến độ giải ngân
                      </h4>
                      <span className="text-[10px] font-medium text-slate-500">
                        {Math.round(((stats?.totalPaidValue || 0) / (stats?.totalValueVND || 1)) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={((stats?.totalPaidValue || 0) / (stats?.totalValueVND || 1)) * 100} 
                      className="h-2 bg-slate-100"
                    />
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight text-slate-400">
                      <span>Đã chi: {(stats?.totalPaidValue / 1000000000).toFixed(1)} tỷ</span>
                      <span>Tổng: {(stats?.totalValueVND / 1000000000).toFixed(1)} tỷ</span>
                    </div>
                  </div>

                  {/* Row 3: Currency Breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      Giá trị theo loại tiền
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {stats?.totalValueByCurrency?.filter((item: any) => item.totalValue > 0).map((item: any) => (
                        <div key={item.currency} className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                            {item.currency}
                          </p>
                          <p className="text-base font-black text-slate-900">
                            {item.totalValue.toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 4: Fees Only */}
                  <div className="pt-1">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 relative overflow-hidden group">
                      <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <h4 className="text-[9px] font-black text-emerald-700 uppercase mb-0.5">
                            Tổng phí ủy thác (VND)
                          </h4>
                          <p className="text-xl font-black text-emerald-900">
                            {(stats?.totalUyThacVND || 0).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* World Map Section */}
          {chartData?.worldMap?.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Bản đồ nhà cung cấp toàn cầu</span>
                </CardTitle>
                <CardDescription>
                  Hiển thị các quốc gia có nhà cung cấp và số lượng hợp đồng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorldMap data={chartData?.worldMap} />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
