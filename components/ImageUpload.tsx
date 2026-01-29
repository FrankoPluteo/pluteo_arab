'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
}

export default function ImageUpload({ onUpload, folder = 'products' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  return (
    <CldUploadWidget
      uploadPreset="pluteo_preset" // We'll create this in Step 5
      options={{
        folder: folder,
        maxFiles: 5,
        resourceType: 'image',
      }}
      onUpload={(result: any) => {
        if (result.event === 'success') {
          onUpload(result.info.secure_url);
        }
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload Image
        </button>
      )}
    </CldUploadWidget>
  );
}