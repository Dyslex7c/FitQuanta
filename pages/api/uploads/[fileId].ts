import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';
import Upload from '@/models/Upload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { fileId } = req.query;

    if (!fileId || typeof fileId !== 'string') {
      return res.status(400).json({ success: false, message: 'fileId required' });
    }

    await connectDB();
    const file = await Upload.findById(fileId).lean();

    if (!file) {
      return res.status(404).send('File not found');
    }

    const buffer = Buffer.from(file.data, 'base64');

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('[FILE VIEW ROUTE ERROR]', error);
    return res.status(500).send('Something went wrong loading the file');
  }
}
