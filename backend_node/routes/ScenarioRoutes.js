// routes/scenario.routes.ts
import { Router } from 'express';
import {
  createScenario,
  getAllScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
} from '../controllers//ScenarioController.js';

const router = Router();

router.post('/', createScenario);
router.get('/', getAllScenarios);
router.get('/:id', getScenarioById);
router.put('/:id', updateScenario);
router.delete('/:id', deleteScenario);

export default router;
