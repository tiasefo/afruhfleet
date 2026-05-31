import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterScreen       from '../screens/auth/RegisterScreen';
import CompanyRegisterScreen from '../screens/auth/CompanyRegisterScreen';
import KYCSubmitScreen      from '../screens/auth/KYCSubmitScreen';

// Role-specific dashboards
import ShipperDashboard      from '../screens/shipper/ShipperDashboard';
import NewShipmentScreen     from '../screens/shipper/NewShipmentScreen';
import ShipmentDetailScreen  from '../screens/shipper/ShipmentDetailScreen';
import DriverDashboard       from '../screens/driver/DriverDashboard';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"           component={LoginScreen} />
      <Stack.Screen name="Register"        component={RegisterScreen} />
      <Stack.Screen name="CompanyRegister" component={CompanyRegisterScreen} />
    </Stack.Navigator>
  );
}

function ShipperStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ShipperHome"
        component={ShipperDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewShipment"
        component={NewShipmentScreen}
        options={{ title: 'New Shipment', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="ShipmentDetail"
        component={ShipmentDetailScreen}
        options={{ title: 'Shipment', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="KYCSubmit"
        component={KYCSubmitScreen}
        options={{ title: 'Identity Verification', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

function DriverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverHome"
        component={DriverDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="KYCSubmit"
        component={KYCSubmitScreen}
        options={{ title: 'Identity Verification', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#E67E22" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === 'delivery_driver' ? (
        <DriverStack />
      ) : (
        // personal_shipper, company_admin, platform_admin → Shipper/default stack
        <ShipperStack />
      )}
    </NavigationContainer>
  );
}
