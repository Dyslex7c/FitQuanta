import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';
import { connectDB } from '@/lib/mongodb';
import Upload from '@/models/Upload';

export const config = {
  api: {
    bodyParser: false, // Disabling Next.js body parser to let Multer handle it
  },
};

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // limit to 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP and PDF are supported.'));
    }
    cb(null, true);
  },
});

function runMiddleware(req: NextApiRequest & { [key: string]: any }, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest & { file?: any }, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Basic auth logic identical to app router verifyAuth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['client', 'trainer', 'admin'].includes(payload.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Run multer middleware
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    await connectDB();

    const base64Data = req.file.buffer.toString('base64');
    const savedFile = await Upload.create({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      data: base64Data,
    });

    const fileUrl = `/api/uploads/${savedFile._id}`;

    return res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        name: req.file.originalname,
      },
    });
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error);
    return res.status(500).json({ success: false, message: error.message || 'Something went wrong' });
  }
}
