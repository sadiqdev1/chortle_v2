import "../../global.css"; 
import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import SplashScreen from "../screens/splash";

export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } 

  return <Redirect href="/welcome" />;
}
   