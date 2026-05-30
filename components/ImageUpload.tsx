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
          style={{
            padding: '9px 16px',
            background: 'var(--color-dark)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Upload Image
        </button>
      )}
    </CldUploadWidget>
  );
}