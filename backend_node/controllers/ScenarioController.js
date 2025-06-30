import ScenarioModel from '../models/Scenario.js';

export const createScenario = async (req, res) => {
  try {
    const newScenario = new ScenarioModel(req.body);
    await newScenario.save();
    res.status(201).json({ message: 'Scenario saved' });
  } catch (err) {
    console.error('❌ Failed to save scenario:', err);
    res.status(500).json({ error: 'Failed to save scenario' });
  }
};

export const getAllScenarios = async (_req, res) => {
  try {
    const scenarios = await ScenarioModel.find();
    res.json(scenarios);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch scenarios', error: err });
  }
};

export const getScenarioById = async (req, res) => {
  try {
    const scenario = await ScenarioModel.findById(req.params.id);
    if (!scenario) return res.status(404).json({ message: 'Scenario not found' });
    res.json(scenario);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch scenario', error: err });
  }
};

export const updateScenario = async (req, res) => {
  try {
    const updated = await ScenarioModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Scenario not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update scenario', error: err });
  }
};

export const deleteScenario = async (req, res) => {
  try {
    const deleted = await ScenarioModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Scenario not found' });
    res.json({ message: 'Scenario deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete scenario', error: err });
  }
};
