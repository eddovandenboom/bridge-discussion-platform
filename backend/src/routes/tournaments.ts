import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { generateTournamentSlug, generateUniqueSlug } from '../utils/slug';

const router = express.Router();
const prisma = new PrismaClient();

// CORS middleware for tournament routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure multer for PBN file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/tournaments');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow PBN files
    if (file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.pbn')) {
      cb(null, true);
    } else {
      cb(new Error('Only PBN files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create new tournament with PBN file upload
router.post('/', upload.single('pbnFile'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, date, venue } = req.body;
    const file = req.file;
    
    // Handle circleIds - parse JSON string to array
    let circleIds: string[] = [];
    if (req.body.circleIds) {
      try {
        circleIds = JSON.parse(req.body.circleIds);
        if (!Array.isArray(circleIds)) {
          circleIds = [req.body.circleIds]; // fallback if not JSON
        }
      } catch (e) {
        // If JSON parsing fails, treat as single string
        circleIds = [req.body.circleIds];
      }
    }
    

    if (!file) {
      return res.status(400).json({ error: 'PBN file is required' });
    }

    if (!name || !date) {
      return res.status(400).json({ error: 'Tournament name and date are required' });
    }

    // Parse date
    const tournamentDate = new Date(date);
    if (isNaN(tournamentDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Generate unique slug
    const baseSlug = generateTournamentSlug(name.trim(), tournamentDate);
    const existingTournaments = await prisma.tournament.findMany({
      select: { id: true }
    });
    const existingSlugs = existingTournaments.map(t => t.id);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        id: uniqueSlug,
        name: name.trim(),
        date: tournamentDate,
        venue: venue?.trim() || null,
        filename: file.filename,
        uploadedBy: userId,
      },
      include: {
        uploader: { select: { id: true, username: true } },
        circles: {
          include: {
            circle: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Share with specified circles
    if (circleIds && circleIds.length > 0) {
      for (const circleId of circleIds) {
        // Verify user is admin of the circle
        const circle = await prisma.circle.findUnique({
          where: { id: circleId },
          include: {
            members: { 
              where: { 
                userId,
                role: 'ADMIN' 
              } 
            }
          }
        }) as { members: any[]; createdBy: string } | null;

        const isAdmin = circle?.members ? circle.members.length > 0 : false;
        const isCreator = circle?.createdBy === userId;

        if (circle && (isCreator || isAdmin)) {
          await prisma.tournamentCircle.create({
            data: {
              tournamentId: tournament.id,
              circleId,
              sharedBy: userId
            }
          });
        }
      }
    }

    // Fetch updated tournament with circles
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        uploader: { select: { id: true, username: true } },
        circles: {
          include: {
            circle: { select: { id: true, name: true } }
          }
        }
      }
    });

    res.status(201).json(updatedTournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
          },
        },
        circles: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
          },
        },
        circles: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
            circle: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get PBN file content for a tournament
router.get('/:id/pbn', async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { filename: true, name: true },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const pbnPath = path.join(__dirname, '../../uploads/tournaments', tournament.filename);

    if (!fs.existsSync(pbnPath)) {
      return res.status(404).json({ error: 'PBN file not found' });
    }

    const pbnContent = fs.readFileSync(pbnPath, 'utf-8');
    
    res.json({
      filename: tournament.filename,
      name: tournament.name,
      content: pbnContent,
    });
  } catch (error) {
    console.error('Error fetching PBN file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;