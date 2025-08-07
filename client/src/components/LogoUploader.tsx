import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Image } from "lucide-react";

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoUpdate: (logoUrl: string) => void;
}

export function LogoUploader({ currentLogo, onLogoUpdate }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Lỗi", 
        description: "Kích thước file không được vượt quá 2MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get upload URL
      const uploadResponse = await apiRequest("/api/logo/upload-url", "POST");
      const { uploadURL } = await uploadResponse.json();

      // Upload file
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Update logo in system settings
      const normalizeResponse = await apiRequest("/api/logo/update", "POST", {
        logoUrl: uploadURL
      });
      const { logoPath } = await normalizeResponse.json();

      onLogoUpdate(logoPath);
      
      toast({
        title: "Thành công",
        description: "Upload logo thành công"
      });

    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Lỗi",
        description: "Không thể upload logo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {currentLogo ? (
          <div className="relative">
            <img 
              src={`/public-objects${currentLogo}`}
              alt="Logo hiện tại" 
              className="w-20 h-20 object-contain border rounded-lg bg-gray-50"
            />
          </div>
        ) : (
          <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          <label htmlFor="logo-upload">
            <Button 
              variant="outline" 
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Đang upload..." : "Chọn logo"}
              </span>
            </Button>
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-1">
            Kích thước gợi ý: 200x80px, tối đa 2MB
          </p>
        </div>
      </div>
    </div>
  );
}