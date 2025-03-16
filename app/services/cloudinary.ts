import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadAudio = async (file: File): Promise<{ url: string; publicId: string }> => {
  try {
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Get filename without extension
    const filename = file.name.replace(/\.[^/.]+$/, "");
    
    // Upload to Cloudinary with original filename
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'video', // Cloudinary uses 'video' type for audio files
      folder: 'web-radio/tracks',
      public_id: filename, // Use original filename
      use_filename: true, // Keep the original filename
      unique_filename: true // Add unique suffix if filename already exists
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteAudio = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete file');
  }
};

export const getStreamUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
  });
}; 