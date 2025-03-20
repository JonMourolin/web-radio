import { v2 as cloudinary } from 'cloudinary';
import { NextApiRequest, NextApiResponse } from 'next';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'web-radio/longmixs/',
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
} 