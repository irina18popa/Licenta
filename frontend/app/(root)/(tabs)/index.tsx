import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="font-rubik text-3xl text-lg my-10">Welcome</Text>
      <Link href="/SignIn">SignIn</Link>
      <Link href="/AddDevice">Add device</Link>
      <Link href="/Profile">Profile</Link>
    </View>
  );
}
