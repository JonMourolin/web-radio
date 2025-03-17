import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadAudio = async (file: File): Promise<{ url: string; publicId: string }> => {
  try {
    console.log('Starting Cloudinary upload process for file:', file.name);
    
    // Convert file to base64
    console.log('Converting file to base64...');
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;
    console.log('File converted to base64, size:', dataURI.length);

    // Get filename without extension
    const filename = file.name.replace(/\.[^/.]+$/, "");
    console.log('Prepared filename for upload:', filename);
    
    // Upload to Cloudinary with original filename
    console.log('Sending upload request to Cloudinary...');
    try {
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'video', // Cloudinary uses 'video' type for audio files
        folder: 'web-radio/tracks',
        public_id: filename, // Use original filename
        use_filename: true, // Keep the original filename
        unique_filename: true, // Add unique suffix if filename already exists
        timeout: 120000, // Increase timeout to 2 minutes for large files
      });
      
      console.log('Cloudinary upload successful, public_id:', result.public_id);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload error:', cloudinaryError);
      throw new Error(`Cloudinary upload failed: ${cloudinaryError.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Error in uploadAudio function:', error);
    throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
  }
};

export const deleteAudio = async (publicId: string): Promise<void> => {
  try {
    console.log('Deleting file from Cloudinary:', publicId);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    console.log('File deleted successfully from Cloudinary');
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error(`Failed to delete file: ${error.message || 'Unknown error'}`);
  }
};

export const getStreamUrl = (publicId: string): string => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
  });
}; 