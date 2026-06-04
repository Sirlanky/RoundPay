import { Redirect } from 'expo-router';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Index() {
  if (!isSupabaseConfigured) {
    return <Redirect href="/(auth)/setup" />;
  }
  return <Redirect href="/(auth)/login" />;
}
