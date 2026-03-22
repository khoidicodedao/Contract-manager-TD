import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useEffect } from "react";

// Tạm thời định nghĩa schema ở đây nếu chưa có trong shared/schema.ts
const formSchema = z.object({
  ten: z.string().min(1, "Tên phòng ban là bắt buộc"),
  moTa: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof formSchema>;

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: any | null;
  onSubmit: (data: DepartmentFormValues) => void;
  isSubmitting: boolean;
}

export default function DepartmentModal({
  isOpen,
  onClose,
  department,
  onSubmit,
  isSubmitting,
}: DepartmentModalProps) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ten: "",
      moTa: "",
    },
  });

  useEffect(() => {
    if (isOpen && department) {
      form.reset({
        ten: department.ten,
        moTa: department.moTa || "",
      });
    } else if (isOpen) {
      form.reset({
        ten: "",
        moTa: "",
      });
    }
  }, [isOpen, department, form]);

  const handleSubmit = (data: DepartmentFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {department ? "Cập nhật phòng ban" : "Thêm phòng ban mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="ten"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên phòng ban *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Phòng Kế hoạch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moTa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mô tả chức năng nhiệm vụ..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thống tin"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
