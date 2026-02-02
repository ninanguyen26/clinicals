import ApiTestScreen from "../../src/screens/ApiTestScreen";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ApiTestScreen />
    </SafeAreaView>
  );
}
