import cron from 'node-cron';
import axios from 'axios';
import ScenarioModel from '../models/Scenario.js';
import dotenv from 'dotenv';

dotenv.config();

function getCurrentTime() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5); // "HH:MM"
  const dayOfWeek = now.getDay(); // 0 = Sunday
  return { hhmm, dayOfWeek };
}

export function startTimeTriggerScheduler()
{
    cron.schedule('* * * * *', async () => {
    const { hhmm, dayOfWeek } = getCurrentTime();
    console.log(`[⏰] Checking triggers at ${hhmm} on day ${dayOfWeek}`);

    const scenarios = await ScenarioModel.find({
        'triggers.type': 'time',
    });

    for (const scenario of scenarios) {
        const timeTriggers = scenario.triggers.filter(t => t.type === 'time');

        const isActiveNow = timeTriggers.some(t => {
        return (
            t.daysOfWeek.includes(dayOfWeek) &&
            (!t.timeFrom || t.timeFrom <= hhmm) &&
            (!t.timeTo || t.timeTo >= hhmm)
        );
        });

        if (isActiveNow) {
        console.log(`✅ Trigger matched: ${scenario.name}`);
        for (const command of scenario.commands) {
            const topic = `app/devices/${command.deviceId}/do_command/in`;
            const payload = {
                protocol: command.protocol,
                address: command.address,
                commands: command.commands,
            };
            try {
                //aici e cerer http post pt handle\
                const res = await axios.post(`${process.env.LOCALHOST_URL}/mqtttopic/handle`, {
                    topic,
                    type : 'publish',
                    payload: JSON.stringify(payload), // 💡 assign it to a key
                } )
                console.log(`▶ Sent command to ${command.deviceId}`);
            } catch (err) {
                console.error(`❌ Failed to send command:`, err.message);
            }
        }
        }
    }
    });
}
