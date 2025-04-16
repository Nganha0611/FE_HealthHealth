import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../HealthHealth/src/locales/i18n"; 
import { AuthProvider } from "../HealthHealth/src/contexts/AuthContext"; 
import AppNavigator from "../HealthHealth/src/navigation/AppNavigator"; 

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
         <AppNavigator />
      </AuthProvider>
    </I18nextProvider>
  );
};

export default App;