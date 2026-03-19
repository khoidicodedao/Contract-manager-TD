import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, Database, RefreshCw, User, Camera, Settings as SettingsIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isRestoring, setIsRestoring] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [tempSettings, setTempSettings] = useState<Record<string, string>>({});

    const { data: settings = {}, isLoading: settingsLoading } = useQuery<Record<string, string>>({
        queryKey: ["/api/settings"],
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: Record<string, string>) => {
            const res = await apiRequest("POST", "/api/settings", newSettings);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
            toast({ description: "Đã cập nhật cài đặt thành công" });
        },
    });

    const handleImageUpload = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            updateSettingsMutation.mutate({ [key]: base64String });
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (key: string, value: string) => {
        updateSettingsMutation.mutate({ [key]: value });
    };

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
                    subtitle="Quản lý cấu hình, sao lưu và khôi phục dữ liệu"
                    onCreateContract={() => { }}
                />
                <main className="flex-1 overflow-auto p-6 bg-slate-50">
                    <div className="max-w-4xl mx-auto space-y-6 pb-12">

                        {/* Profile & System Info Section */}
                        <Card className="border-t-4 border-t-primary">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <User className="w-6 h-6 text-primary" />
                                    <CardTitle>Thông tin cá nhân & Hệ thống</CardTitle>
                                </div>
                                <CardDescription>
                                    Tùy chỉnh thông tin người dùng và hình ảnh hiển thị trên toàn hệ thống.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* User Info */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="system-name">Tên hệ thống (Sidebar)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="system-name"
                                                    placeholder="Ví dụ: Quản lý dự án"
                                                    value={tempSettings.SYSTEM_NAME ?? settings.SYSTEM_NAME ?? ""}
                                                    onChange={(e) => setTempSettings(prev => ({ ...prev, SYSTEM_NAME: e.target.value }))}
                                                />
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    disabled={updateSettingsMutation.isPending || tempSettings.SYSTEM_NAME === undefined}
                                                    onClick={() => {
                                                        if (tempSettings.SYSTEM_NAME !== undefined) {
                                                            handleInputChange("SYSTEM_NAME", tempSettings.SYSTEM_NAME);
                                                            setTempSettings(prev => {
                                                                const { SYSTEM_NAME, ...rest } = prev;
                                                                return rest;
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Lưu
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 border-t pt-4">
                                            <Label htmlFor="user-name">Họ và tên người dùng</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="user-name"
                                                    placeholder="Nhập họ và tên"
                                                    value={tempSettings.USER_NAME ?? settings.USER_NAME ?? ""}
                                                    onChange={(e) => setTempSettings(prev => ({ ...prev, USER_NAME: e.target.value }))}
                                                />
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    disabled={updateSettingsMutation.isPending || tempSettings.USER_NAME === undefined}
                                                    onClick={() => {
                                                        if (tempSettings.USER_NAME !== undefined) {
                                                            handleInputChange("USER_NAME", tempSettings.USER_NAME);
                                                            setTempSettings(prev => {
                                                                const { USER_NAME, ...rest } = prev;
                                                                return rest;
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Lưu
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="user-role">Chức vụ / Đơn vị</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="user-role"
                                                    placeholder="Nhập chức vụ"
                                                    value={tempSettings.USER_ROLE ?? settings.USER_ROLE ?? ""}
                                                    onChange={(e) => setTempSettings(prev => ({ ...prev, USER_ROLE: e.target.value }))}
                                                />
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    disabled={updateSettingsMutation.isPending || tempSettings.USER_ROLE === undefined}
                                                    onClick={() => {
                                                        if (tempSettings.USER_ROLE !== undefined) {
                                                            handleInputChange("USER_ROLE", tempSettings.USER_ROLE);
                                                            setTempSettings(prev => {
                                                                const { USER_ROLE, ...rest } = prev;
                                                                return rest;
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Lưu
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Photo Uploads */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 text-center">
                                            <Label>Ảnh đại diện (User)</Label>
                                            <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 mx-auto mt-2">
                                                {updateSettingsMutation.isPending && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                                                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                                <img
                                                    src={settings.USER_PHOTO || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128"}
                                                    alt="User Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <Camera className="text-white w-6 h-6" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload("USER_PHOTO")}
                                                        disabled={updateSettingsMutation.isPending}
                                                    />
                                                </label>
                                            </div>
                                            {settings.USER_PHOTO && (
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="text-red-500 h-auto p-0 mt-1"
                                                    onClick={() => handleInputChange("USER_PHOTO", "")}
                                                    disabled={updateSettingsMutation.isPending}
                                                >
                                                    Xóa ảnh
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-4 text-center">
                                            <Label>Logo & Thông tin Developer</Label>
                                            <div className="relative group w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200 bg-white mx-auto flex items-center justify-center p-2 mt-2">
                                                {updateSettingsMutation.isPending && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                                                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                                                    </div>
                                                )}
                                                {settings.DEVELOPER_PHOTO ? (
                                                    <img
                                                        src={settings.DEVELOPER_PHOTO}
                                                        alt="Developer Logo"
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                                        <SettingsIcon className="text-primary w-6 h-6" />
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    <Camera className="text-white w-6 h-6" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload("DEVELOPER_PHOTO")}
                                                        disabled={updateSettingsMutation.isPending}
                                                    />
                                                </label>
                                            </div>
                                            {settings.DEVELOPER_PHOTO && (
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="text-red-500 h-auto p-0 mt-1"
                                                    onClick={() => handleInputChange("DEVELOPER_PHOTO", "")}
                                                    disabled={updateSettingsMutation.isPending}
                                                >
                                                    Xóa ảnh
                                                </Button>
                                            )}
                                            <div className="mt-4 space-y-2 text-left">
                                                <Label htmlFor="developer-name" className="text-xs">Tên Developer</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="developer-name"
                                                        placeholder="Nhập tên"
                                                        value={tempSettings.DEVELOPER_NAME ?? settings.DEVELOPER_NAME ?? ""}
                                                        onChange={(e) => setTempSettings(prev => ({ ...prev, DEVELOPER_NAME: e.target.value }))}
                                                        className="h-8 text-xs"
                                                    />
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="h-8 px-2"
                                                        disabled={updateSettingsMutation.isPending || tempSettings.DEVELOPER_NAME === undefined}
                                                        onClick={() => {
                                                            if (tempSettings.DEVELOPER_NAME !== undefined) {
                                                                handleInputChange("DEVELOPER_NAME", tempSettings.DEVELOPER_NAME);
                                                                setTempSettings(prev => {
                                                                    const { DEVELOPER_NAME, ...rest } = prev;
                                                                    return rest;
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        Lưu
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing Backup Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <Database className="w-6 h-6 text-blue-600" />
                                    <CardTitle>Sao lưu dữ liệu</CardTitle>
                                </div>
                                <CardDescription>
                                    Tải xuống bản sao lưu đầy đủ của cơ sở dữ liệu hệ thống.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleDownloadBackup} className="bg-blue-600 hover:bg-blue-700">
                                    <Download className="w-4 h-4 mr-2" />
                                    Tải xuống bản sao lưu (.sqlite)
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Existing Restore Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <RefreshCw className="w-6 h-6 text-orange-600" />
                                    <CardTitle>Khôi phục dữ liệu</CardTitle>
                                </div>
                                <CardDescription>
                                    Khôi phục cơ sở dữ liệu từ file sao lưu.
                                    <br />
                                    <span className="text-red-600 font-semibold">LƯU Ý QUAN TRỌNG:</span> Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại.
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
