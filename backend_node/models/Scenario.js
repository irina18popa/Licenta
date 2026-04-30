import mongoose from 'mongoose';

const CommandSchema = new mongoose.Schema({
  deviceId: String,
  protocol: String,
  address: String,
  commands: [mongoose.Schema.Types.Mixed], // code/value or name/params
});

const TriggerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['time', 'temperature'],
    required: true,
  },

  // Time-based trigger
  timeFrom: String,           // e.g. "08:00"
  timeTo: String,             // e.g. "10:00"
  daysOfWeek: [Number],       // 0=Sun, 1=Mon, etc.

  // Temperature-based trigger
  temperature: Number,        // e.g. 25
  temperatureCondition: {     // e.g. "above" or "below"
    type: String,
    enum: ['above', 'below'],
  },
  lastExecutedAt: {type:Date, default:Date.now} // used for cooldown
});


const ScenarioSchema = new mongoose.Schema({
  name: {type:String, required:true},
  triggers: [TriggerSchema],
  commands: [CommandSchema],
});

const ScenarioModel = mongoose.models.Scenario || mongoose.model('Scenario', ScenarioSchema);
export default ScenarioModel
