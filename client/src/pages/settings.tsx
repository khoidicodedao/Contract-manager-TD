"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, Database, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function Settings() {
    const { toast } = useToast();
    const [isRestoring, setIsRestoring] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDownloadBackup = async () => {
        try {
            window.open("/api/backup", "_blank");
            toast({
                title: "Đang tải xuống",
                description: "Quá trình tải xuống bản sao lưu đã bắt đầu.",
            });
        } catch (error) {
            console.error("Download error:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải xuống bản sao lưu.",
                variant: "destructive",
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleRestore = async () => {
        if (!file) {
            toast({
                title: "Chưa chọn file",
                description: "Vui lòng chọn file backup để khôi phục.",
                variant: "destructive",
            });
            return;
        }

        if (!confirm("CẢNH BÁO: Dữ liệu hiện tại sẽ bị thay thế bằng dữ liệu từ file backup. Bạn có chắc chắn muốn tiếp tục?")) {
            return;
        }

        setIsRestoring(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/restore", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Lỗi khi khôi phục dữ liệu");
            }

            const data = await res.json();
            toast({
                title: "Thành công",
                description: data.message,
            });

            // Reload page after successful restore to refresh data
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error: any) {
            console.error("Restore error:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể khôi phục dữ liệu.",
                variant: "destructive",
            });
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Cài đặt hệ thống"
                    subtitle="Quản lý sao lưu và khôi phục cơ sở dữ liệu"
                    onCreateContract={() => { }}
                />
                <main className="flex-1 overflow-auto p-6 bg-slate-50">
                    <div className="max-w-4xl mx-auto space-y-6">

                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <Database className="w-6 h-6 text-blue-600" />
                                    <CardTitle>Sao lưu dữ liệu</CardTitle>
                                </div>
                                <CardDescription>
                                    Tải xuống bản sao lưu đầy đủ của cơ sở dữ liệu hệ thống. File này có thể được sử dụng để khôi phục hệ thống trong trường hợp gặp sự cố.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleDownloadBackup} className="bg-blue-600 hover:bg-blue-700">
                                    <Download className="w-4 h-4 mr-2" />
                                    Tải xuống bản sao lưu (.sqlite)
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <RefreshCw className="w-6 h-6 text-orange-600" />
                                    <CardTitle>Khôi phục dữ liệu</CardTitle>
                                </div>
                                <CardDescription>
                                    Khôi phục cơ sở dữ liệu từ file sao lưu.
                                    <br />
                                    <span className="text-red-600 font-semibold">LƯU Ý QUAN TRỌNG:</span> Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu trong file backup. Quá trình này không thể hoàn tác.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="backup-file">Chọn file backup (.sqlite)</Label>
                                    <Input
                                        id="backup-file"
                                        type="file"
                                        accept=".sqlite,.db"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <Button
                                    onClick={handleRestore}
                                    disabled={isRestoring || !file}
                                    variant="destructive"
                                >
                                    {isRestoring ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Đang khôi phục...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Tiến hành khôi phục
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </main>
            </div>
        </div>
    );
}
