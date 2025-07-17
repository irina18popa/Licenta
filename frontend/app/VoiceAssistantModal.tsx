import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { sendVoiceRecord } from "./apis"; // Import your backend function
import * as Speech from "expo-speech";

interface Props {
  onClose: () => void;
}

export default function VoiceAssistantModal({ onClose }: Props) {
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startRecording();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);


  const speak = (text) => {
    if (text) {
      Speech.speak(text);
    }
  };
  

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access microphone was denied");
        onClose();
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
      setAudioUri(null);
      setTranscript("");
    } catch (e) {
      alert("Error starting recording");
      onClose();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setAudioUri(uri);

      if (uri) {
        const formData = new FormData();
        const filename = uri.split("/").pop();
        formData.append("file", {
          uri,
          name: filename,
          type: "audio/m4a",
        });
        const response = await sendVoiceRecord(formData);
        
        speak(response)
        setTranscript(response)
      
      }
    } catch (e) {
      console.error(e)
      alert("Recording/transcription error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      if (recording) await recording.stopAndUnloadAsync();
    } catch {}
    onClose();
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={handleClose}>
        <View className="flex-1 justify-center items-center px-6 bg-black/90 rounded-lg">
          <TouchableOpacity
            className="absolute right-6 top-12 z-10 p-2"
            onPress={handleClose}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold mb-8">Voice Assistant</Text>
          {!audioUri && !loading && (
            <>
              <Text className="text-white text-lg mb-4">Listening...</Text>
              <TouchableOpacity className="flex-row items-center bg-red-600 px-8 py-4 rounded-full" onPress={stopRecording}>
                <FontAwesome name="stop" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          {loading && <ActivityIndicator size="large" color="#fff" className="mt-6" />}
          {transcript ? (
            <View className="mt-8 items-center">
              <Text className="text-white text-base text-center">{transcript}</Text>
              <TouchableOpacity
                className="mt-6 bg-gray-600 px-8 py-4 rounded-full"
                onPress={handleClose}
              >
                <Text className="text-white font-bold text-base">Close</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
    </Modal>
  );
}
