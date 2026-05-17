import { Stack } from 'expo-router';

export default function PetsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="view" />
      <Stack.Screen name="reminder" />
      <Stack.Screen name="add-reminder" />
      <Stack.Screen name="medical" />
      <Stack.Screen name="medical-detail" />
      <Stack.Screen name="add-medical" />
      <Stack.Screen name="co-parent" />
    </Stack>
  );
}
