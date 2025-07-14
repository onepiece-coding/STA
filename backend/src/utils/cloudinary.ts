import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function cloudinaryUploadImage(
  buffer: Buffer,
  opts?: UploadApiOptions
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts ?? {}, (err, res) => {
      if (err) return reject(new Error('Internal server error (Cloudinary)'));
      resolve(res!);
    });
    stream.end(buffer);
  });
}

export async function cloudinaryRemoveImage(
  publicId: string
): Promise<UploadApiResponse> {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    throw new Error('Internal server error (Cloudinary remove)');
  }
}

export async function cloudinaryRemoveMultipleImages(
  publicIds: string[]
): Promise<any> {
  try {
    return await cloudinary.api.delete_resources(publicIds);
  } catch (err) {
    throw new Error('Internal server error (Cloudinary remove multiple)');
  }
}