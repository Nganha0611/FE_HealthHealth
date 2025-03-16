import React from "react";
import { AuthProvider } from "../HealthHealth/src/contexts/AuthContext"; 
import AppNavigator from "../HealthHealth/src/navigation/AppNavigator"; 
const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
