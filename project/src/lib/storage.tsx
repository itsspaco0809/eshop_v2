// src/lib/storage.ts
import { supabase } from '@/lib/supabase';

export const handleSecureDownload = async (filePath: string, downloadName?: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('digital_files')
      .createSignedUrl(filePath, 300, {
        download: downloadName || true,
      });

    if (error) {
      alert(`Download failed: ${error.message}`);
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  } catch (err: any) {
    console.error('Error generating signed URL:', err);
  }
};