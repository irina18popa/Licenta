import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: String,        
  deviceId: String,    
  command: String,
  status:String,
  value: mongoose.Schema.Types.Mixed  
});

const LogModel = mongoose.models.Log || mongoose.model('Log', LogSchema);
export default LogModel;
