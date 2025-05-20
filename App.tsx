import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./src/locales/i18n"; 
import { AuthProvider } from "./src/contexts/AuthContext"; 
import AppNavigator from "./src/navigation/AppNavigator"; 
import { NotificationProvider } from "./src/contexts/NotificationContext"; 
import TestCounterScreen from "./src/components/StepCounterScreen";
import HeartRateTest from "./src/components/HeartRateTest";
import BloodPressureTest from "./src/components/BloodPressureTest";

const App = () => {
  return (
    // <I18nextProvider i18n={i18n}>
    //   <AuthProvider>
    //     <NotificationProvider>
    //       <AppNavigator />
    //     </NotificationProvider>
    //   </AuthProvider>
    // </I18nextProvider>
    // <TestCounterScreen />
    // <HeartRateTest />
    <BloodPressureTest/>
  );
};

export default App;