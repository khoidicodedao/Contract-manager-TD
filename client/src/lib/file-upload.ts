import { apiRequest } from "./queryClient";

export async function uploadFileAsDocument(
    file: File,
    hopDongId: number,
    note: string = ""
): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("hopDongId", hopDongId.toString());
    formData.append("tenFile", file.name);
    formData.append("loaiFile", file.type);
    formData.append("ghiChu", note);

    try {
        const res = await fetch("/api/file-hop-dong", {
            method: "POST",
            body: formData,
        });

        if (res.ok) {
            const fileRecord = await res.json();
            return `/api/file-hop-dong/${fileRecord.id}/download`;
        }
    } catch (error) {
        console.error("File upload failed:", error);
    }
    return null;
}
