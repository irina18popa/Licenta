import nlp from 'compromise'
import axios from 'axios';

// You can expand these lists as you add more devices/rooms
// const deviceKeywords = ['lamp', 'light', 'plug', 'sensor', 'tv'];
// const roomKeywords = ['living room', 'bedroom', 'kitchen', 'bathroom', 'office', 'lounge', 'salon'];


let deviceKeywords = [];
let roomKeywords = [];
let deviceNameToId = {};
let roomNameToId = {};
let feedbackMessage = null

export const refreshKeywords = async () => {
  try {
    const [roomsRes, devicesRes] = await Promise.all([
      axios.get(`${process.env.LOCALHOST_URL}/room`),
      axios.get(`${process.env.LOCALHOST_URL}/devices`)
    ]);

    // Use lowercase for keys to match parsing logic
    roomKeywords = [];
    roomNameToId = {};
    roomsRes.data.forEach(room => {
      const name = room.name.toLowerCase();
      roomKeywords.push(name);
      roomNameToId[name] = room._id;
    });

    deviceKeywords = [];
    deviceNameToId = {};
    devicesRes.data.forEach(device => {
      const name = device.name.toLowerCase();
      deviceKeywords.push(name);
      deviceNameToId[name] = device._id;
      
    });

  } catch (err) {
    console.error('Error fetching room/device names:', err.message);
  }
}

export async function send_command(topic, type, payload) {
  try {
    console.log(`published to ${topic} payload: ${payload}`)

    const res = await axios.post(`${process.env.LOCALHOST_URL}/mqtttopic/handle`, {
      topic,
      type,
      payload,
    });
    return res.data;
  } catch (err) {
    console.error('Failed to send the request:', err.response?.data || err.message);
    throw new Error('Failed to send the request');
  }
}

const findCommandByKeyword = (commands, keyword) => {
  return commands.find(c => c.name.toLowerCase().includes(keyword));
};


const parseCommand = async(text) => {
  const lowerText = text.toLowerCase()
  console.log(lowerText)
  const doc = nlp(lowerText);
  await refreshKeywords()

  // Simple intent detection
  let intent = null, volume = null, colour = null;

  const colorHSV = {
    red:    { h: 0,   s: 1000, v: 1000 },
    green:  { h: 120, s: 1000, v: 1000 },
    blue:   { h: 240, s: 1000, v: 1000 },
    yellow: { h: 60,  s: 1000, v: 1000 },
    orange: { h: 30,  s: 1000, v: 1000 },
    purple: { h: 276, s: 330,  v: 1000 },
    pink:   { h: 320, s: 480,  v: 1000 },
    cyan:   { h: 180, s: 1000, v: 1000 },
    magenta:{ h: 300, s: 1000, v: 1000 },
    white:  { h: 0,   s: 0,    v: 1000 },
    // Add more if needed
  };


  if (lowerText.match(/\b(turn|switch|power) on\b/)) intent = 'switch_on';
  if (lowerText.match(/\b(turn|switch|power) off\b/)) intent = 'switch_off';

  const colorMatch = lowerText.match(/\b(set|change|turn) (\w+) (to )?(red|white|green|blue|yellow|orange|purple|pink|cyan|magenta)\b/);
  if (colorMatch) {
  intent = 'set_colour';
  colour = colorMatch[4];
  // store color in your return value!
}

  // TV - mute/unmute/volume
  if (lowerText.match(/\b(mute)\b/)) intent = 'mute';
  if (lowerText.match(/\b(unmute)\b/)) intent = 'unmute';

  const volumeMatch = lowerText.match(/\b(set|change) volume (to|at)? (\d+)\b/);
  if (volumeMatch) {
    intent = 'set_volume';
    volume = parseInt(volumeMatch[3], 10);
    // store volume in your return value!
  }

  if (lowerText.match(/\b(set|enable|turn on) (child protection|child lock)\b/)) intent = 'child_protection_on';
  if (lowerText.match(/\b(unset|disable|turn off|set off) (child protection|child lock)\b/)) intent = 'child_protection_off';


  // Device extraction (longest match first, for 'living room lamp')
  let device = null, deviceId = null;

  for (let d of deviceKeywords.sort((a,b) => b.length - a.length)) {
    if (doc.has(d)) {
      device = d;
      deviceId = deviceNameToId[d];
      break;
    }
  }

  // Room extraction
  let room = null, roomId = null;

  for (let r of roomKeywords.sort((a,b) => b.length - a.length)) {
    if (doc.has(r)) {
      room = r;
      roomId = roomNameToId[r]
      break;
    }
  }

  let commandValue = null
  let parameterName = null

  if (deviceId) {
    try {
      const commandRes = await axios.get(`${process.env.LOCALHOST_URL}/devicecommands/${deviceId}`);
      const commands = commandRes.data.commands || commandRes.data[0]?.commands || [];


      let cmd = null;
      let payload = {}


      if (intent === 'switch_on' || intent === 'switch_on') {
        const switchCmd = findCommandByKeyword(commands, 'switch');
        // handle on/off
        const boolParam = switchCmd.parameters.find(p => p.type.toLowerCase() === 'boolean');
        if (boolParam) {
          parameterName = boolParam.name;
          commandValue = (intent === "switch_on") ? true : (intent === "switch_off") ? false : null;
          
          payload = {
            commands: [
              { code: parameterName, value: commandValue }
            ]
          }; 
        }
      } else if (intent === 'mute' || intent === 'unmute') {
        const muteCmd = findCommandByKeyword(commands, 'mute');
        parameterName = 'urn:schemas-upnp-org:service:RenderingControl:1:SetMute'
       
        if (intent === "mute")
        {
          commandValue = { InstanceID: 0, Channel: 'Master', DesiredMute: true }
        }else{
          commandValue = { InstanceID: 0, Channel: 'Master', DesiredMute: false }
        }
        // handle set volume
        payload = {
            commands: [
              { name: parameterName, parameters: commandValue }
            ]
        };
      } else if (intent === 'child_protection_on' || intent === 'child_protection_off') {
        const childCmd = findCommandByKeyword(commands, 'child');
        // handle child protection on/off
        const boolParam = childCmd.parameters.find(p => p.type.toLowerCase() === 'boolean');
        if (boolParam) {
          parameterName = boolParam.name;
          commandValue = (intent === "child_protection_on") ? true : (intent === "child_protection_off") ? false : null;
          
          payload = {
            commands: [
              { code: parameterName, value: commandValue }
            ]
          }; 
        }
      } else if (intent === 'set_volume') {
        const volumeCmd = findCommandByKeyword(commands, 'volume');
        parameterName = 'urn:schemas-upnp-org:service:RenderingControl:1:SetVolume'
        commandValue = { InstanceID: 0, Channel: 'Master', DesiredVolume: volume }
        // handle set volume
        payload = {
            commands: [
              { name: parameterName, parameters: commandValue }
            ]
        };
        
      } else if (intent === 'set_colour') {
        const colourCmd = findCommandByKeyword(commands, 'colour')
        parameterName = 'colour_data_v2';
        commandValue = colorHSV[colour];

        payload = {
            commands: [
              { code: parameterName, value: commandValue }
            ]
          };
      } 

        let protocol =null, address =null

        const info = await axios.get(`${process.env.LOCALHOST_URL}/devices/${deviceId}`);

        if(info.data.protocol === 'upnp')
        {
          protocol = info.data.protocol
          address = info.data.uuid
        }
        else if(info.data.manufacturer === "TUYA")
        {
          protocol = info.data.manufacturer.toLowerCase()
          address = info.data.metadata
        }

        const fullPayload = {
          protocol,
          address,
          ...payload
        };

        const topic = `app/devices/${deviceId}/do_command/in`;
        const type = "publish";

        send_command(topic, type, JSON.stringify(fullPayload))
        feedbackMessage = "It's done, my friend"
      //else{aici pun raspunsul ca nu pot in engleza pt feedback}
    } catch (err) {
      feedbackMessage = "I can't do that, my friend"
      console.error('Error fetching device commands:', err.message);
    }
  }


  deviceKeywords = []
  deviceNameToId = {}
  roomKeywords = []
  roomNameToId = {}

  return feedbackMessage;
}

export default parseCommand

// === Test Cases ===
// const tests = [
//   'Turn on the living room lamp',
//   'Switch off the plug in the kitchen',
//   'Turn on the tv',
//   'Turn off bedroom light',
//   'Turn on plug',
//   'Switch on the bathroom lamp',
//   'Turn on  t&h sensor'
// ];

// for (const t of tests) {
//   console.log(`"${t}" =>`, parseCommand(t));
// }
