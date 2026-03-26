import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET all vocabulary
router.get('/', async (req: Request, res: Response) => {
  try {
    const vocabulary = await prisma.vocabulary.findMany();
    const formattedVocab = vocabulary.map(v => ({
      ...v,
      examples: JSON.parse(v.examples),
    }));
    res.json(formattedVocab);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET vocabulary by type
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        type: req.params.type,
      },
    });
    const formattedVocab = vocabulary.map(v => ({
      ...v,
      examples: JSON.parse(v.examples),
    }));
    res.json(formattedVocab);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET vocabulary by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vocab = await prisma.vocabulary.findUnique({
      where: { id: req.params.id },
    });
    if (vocab) {
      const formattedVocab = {
        ...vocab,
        examples: JSON.parse(vocab.examples),
      };
      res.json(formattedVocab);
    } else {
      res.status(404).json({ error: 'Vocabulary not found' });
    }
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
