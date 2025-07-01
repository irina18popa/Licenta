// import React, { useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// import { WebView } from 'react-native-webview';
// import * as Speech from 'expo-speech';
// import { Audio } from 'expo-av';


// export default function VoiceAssistant() {
//   const [recognizedText, setRecognizedText] = useState('');
//   const [listening, setListening] = useState(false);
//   const webViewRef = useRef(null);

//   const handleResult = (msg: string) => {
//     if (msg.startsWith('ERROR')) {
//       console.warn(msg);
//     } else {
//       setRecognizedText(msg);
//       Speech.speak(`You said: ${msg}`);
//     }
//     setListening(false);
//   };

//     async function askMicrophonePermission() {
//     const { status } = await Audio.requestPermissionsAsync();
//     if (status !== 'granted') {
//         alert('Microphone permission is required for speech recognition.');
//         return false;
//     }
//     return true;
//     }


//   const speechRecognitionHTML = `
//     <!DOCTYPE html>
//     <html>
//     <body style="background:black; color:white; font-size:18px; text-align:center;">
//       <p>🎤 Listening...</p>
//       <script>
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//         const recognition = new SpeechRecognition();
//         recognition.continuous = false;
//         recognition.interimResults = false;
//         recognition.lang = 'en-US';

//         recognition.onresult = function(event) {
//           const text = event.results[0][0].transcript;
//           window.ReactNativeWebView.postMessage(text);
//         };

//         recognition.onerror = function(event) {
//           window.ReactNativeWebView.postMessage("ERROR: " + event.error);
//         };

//         window.onload = () => recognition.start();
//       </script>
//     </body>
//     </html>
//   `;

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>🎙️ Voice Assistant</Text>

//       {listening && (
//         <WebView
//           ref={webViewRef}
//           source={{ html: speechRecognitionHTML }}
//           onMessage={(event) => handleResult(event.nativeEvent.data)}
//           style={{ height: 100, width: '100%', backgroundColor: 'black' }}
//         />
//       )}

//       <Text style={styles.text}>
//         {recognizedText ? `🗣 You said: "${recognizedText}"` : 'Press the button to speak'}
//       </Text>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={async () => {
//             const granted = await askMicrophonePermission();
//             if (granted) setListening(true);
//             }}
//         disabled={listening}
//       >
//         <Text style={styles.buttonText}>
//           {listening ? 'Listening…' : 'Start Voice Input'}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   title: {
//     color: 'white',
//     fontSize: 26,
//     marginBottom: 20,
//     fontWeight: 'bold',
//   },
//   text: {
//     color: 'white',
//     fontSize: 18,
//     marginVertical: 20,
//     textAlign: 'center',
//   },
//   button: {
//     backgroundColor: '#1e90ff',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 30,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//   },
// });


import React, { useState } from 'react';
import { View, Button, StyleSheet, Alert, Text } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export default function VoiceAssistant() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Start recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access microphone was denied');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setAudioUri(null); // clear last
    } catch (e) {
      Alert.alert('Error starting recording', String(e));
    }
  };

  // Stop recording and get uri
  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      console.log(audioUri); // <-- Still the OLD value!
      console.log(uri);      // <-- The NEW value!

      setRecording(null);

      // --- Verification step ---
      if (!uri) {
        Alert.alert('No recording saved. Try again!');
      } else {
        // Optional: check file size (to see if not empty)
        // On web, you can fetch(uri) and check, on device, it's usually ok if uri exists
        Alert.alert('Recording saved!', `File: ${uri}`);
        console.log(uri)
      }
      // After you get audioUri (after stopping recording)
      const info = await FileSystem.getInfoAsync(uri);
      console.log('Audio file info:', info);

      if (info.exists) {
        console.log(info.size)
        Alert.alert('Audio file size', info.size ? `${info.size} bytes` : 'File exists, unknown size');
      } else {
        Alert.alert('File not found', 'Recording file does not exist');
      }
    } catch (e) {
      Alert.alert('Error stopping recording', String(e));
    }
  };

  // Play the recording
  const playRecording = async () => {
  try {
    if (!audioUri) {
      Alert.alert('No recording to play!');
      return;
    }
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true }); // Ensures playback even if phone is on silent
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    const { sound: playbackObj } = await Audio.Sound.createAsync({ uri: audioUri });
    setSound(playbackObj);
    setIsPlaying(true);
    await playbackObj.playAsync();
    playbackObj.setOnPlaybackStatusUpdate(status => {
      if (!status.isLoaded) {
        setIsPlaying(false);
        playbackObj.unloadAsync();
        setSound(null);
        return;
      }
      if (!status.isPlaying) {
        setIsPlaying(false);
        playbackObj.unloadAsync();
        setSound(null);
      }
    });
  } catch (e) {
      console.log('Playback error', e);
    Alert.alert('Could not play recording', String(e));
  }
};

const playTestSound = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('./recording.m4a') // Place any short mp3 in your project
  );
  await sound.playAsync();
};



  // UI
  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      <View style={{ height: 20 }} />
      {audioUri && (
        <Button
          title={isPlaying ? 'Playing...' : 'Play Recording'}
          onPress={playRecording}
          disabled={isPlaying}
        />
      )}
      {audioUri && (
        <Text style={{ marginTop: 20, color: 'gray', fontSize: 12 }}>Recorded file: {audioUri}</Text>
      )}
      <Button title="Play Test Sound" onPress={playTestSound} />

      <Button
        title="Share Recording"
        onPress={() => audioUri && Sharing.shareAsync(audioUri)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
