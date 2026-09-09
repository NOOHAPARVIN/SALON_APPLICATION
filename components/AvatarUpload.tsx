"use client";

import { useState, useRef } from "react";
import { FaCamera, FaSpinner } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";

interface AvatarUploadProps {
  staffId: string | number;
  initialAvatarUrl: string | null;
  name: string;
  color: string;
}

export default function AvatarUpload({ staffId, initialAvatarUrl, name, color }: AvatarUploadProps) {
  const { showAlert } = useModal();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert("Invalid File", "Please upload an image file.", "warning");
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert("File Too Large", "File is too large. Maximum size is 5MB.", "warning");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("staffId", staffId.toString());

    try {
      const res = await fetch("/api/staff/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAvatarUrl(data.avatar_url);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        showAlert("Error", "Upload failed: " + (data.error || "Unknown error"), "error");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      showAlert("Connection Error", "Server connection error during upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group cursor-pointer" onClick={triggerFileInput}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        className={`w-32 h-32 rounded-full border-4 border-white flex items-center justify-center text-5xl text-white font-bold shadow-md bg-cover bg-center transition-opacity ${uploading ? 'opacity-50' : 'group-hover:opacity-90'}`}
        style={{ 
          backgroundColor: color,
          backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none'
        }}
      >
        {!avatarUrl && name.charAt(0).toUpperCase()}
      </div>

      {/* Upload Overlay */}
      <div className={`absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/40 text-white transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {uploading ? (
          <FaSpinner className="animate-spin text-2xl" />
        ) : (
          <>
            <FaCamera className="text-xl mb-1" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Upload</span>
          </>
        )}
      </div>
    </div>
  );
}
