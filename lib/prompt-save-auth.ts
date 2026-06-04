import { Alert } from 'react-native';

type Options = {
  action: string;
  onGuest: () => void | Promise<void>;
  onSignIn: () => void;
  showGuest?: boolean;
};

/** Alert when a flow needs a saved account (create/join group). */
export function promptSaveAuth({ action, onGuest, onSignIn, showGuest = __DEV__ }: Options) {
  const buttons: {
    text: string;
    style?: 'cancel' | 'default';
    onPress?: () => void;
  }[] = [{ text: 'Cancel', style: 'cancel' }];

  if (showGuest) {
    buttons.push({
      text: 'Guest account',
      onPress: () => {
        void onGuest();
      },
    });
  }

  buttons.push({ text: 'Sign in with email', onPress: onSignIn });

  const guestLine = showGuest
    ? ' Or tap Guest account to save without email (enable Anonymous sign-ins in Supabase).'
    : '';
  Alert.alert('Account required', `To ${action}, sign in with email.${guestLine}`, buttons);
}
