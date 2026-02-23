import React from "react";
import { Upload, X, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";

interface FileAttachmentSectionProps {
    selectedFile: File | null;
    onFileSelect: (file: File | null) => void;
    existingFileUrl?: string | null;
    mode?: "create" | "edit" | "view";
    label?: string;
}

export function FileAttachmentSection({
    selectedFile,
    onFileSelect,
    existingFileUrl,
    mode = "create",
    label = "Văn bản đính kèm",
}: FileAttachmentSectionProps) {
    const fileInputId = React.useId();

    return (
        <div className="space-y-2">
            <FormLabel>{label}</FormLabel>
            {mode !== "view" && (
                <div
                    className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) onFileSelect(file);
                    }}
                    onClick={() => document.getElementById(fileInputId)?.click()}
                >
                    <input
                        type="file"
                        id={fileInputId}
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onFileSelect(file);
                        }}
                    />
                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                        Kéo thả hoặc nhấp để chọn file văn bản
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        PDF, DOC, XLS, PNG, JPG (Tối đa 10MB)
                    </p>
                </div>
            )}

            {selectedFile && (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-md mt-2">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                            {selectedFile.name}
                        </span>
                        <span className="text-xs text-slate-500">
                            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onFileSelect(null)}
                        className="h-7 w-7 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {!selectedFile && existingFileUrl && (
                <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-md mt-2">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm truncate font-medium">Tài liệu hiện tại</span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(existingFileUrl, "_blank")}
                    >
                        Mở
                    </Button>
                </div>
            )}
        </div>
    );
}
