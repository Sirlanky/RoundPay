import { Redirect, useLocalSearchParams } from 'expo-router';

export default function JoinDeepLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={{ pathname: '/group/join', params: { code: code?.toString().toUpperCase() } }} />;
}
