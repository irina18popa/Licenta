import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

//android: 176956705893-d5gv61ogac51rkn3tr0kvi6i5d1ut8i4.apps.googleusercontent.com
//ios: 176956705893-89kclsumbol6ksi3lfbknsdbkru4o0uu.apps.googleusercontent.com
//web: 

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text className="font-rubik text-3xl text-lg my-10">Welcome</Text>
        <Link href="/SignUp">SignIn</Link>
        <Link href="/AddDevice">Add device</Link>
        <Link href="/Profile">Profile</Link>
        <Link href="/properties/RemoteControl">Remote</Link>
        <Link href="/LogIn">LogIn</Link>
        <Link href="/HomeScreen">Home Screen</Link>
      </View>
    </SafeAreaView>
  );
}
