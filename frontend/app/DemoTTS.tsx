import React, { useState } from 'react';
import { View, Button, TextInput, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

export default function TTSExample() {
  const [text, setText] = useState('Hello, this is a demo!');

  const speak = () => {
    if (text) {
      Speech.speak(text);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type something to say..."
      />
      <Button title="Speak" onPress={speak} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  input: {
    borderColor: '#aaa',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    fontSize: 18,
  },
});
