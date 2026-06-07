import { useRouter } from 'expo-router';
import { Button } from './Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTransactionPin } from '@/contexts/TransactionPinContext';
import { formatNaira } from '@/lib/format';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';

interface Props {
  groupId: string;
  contributionId: string;
  amount: number;
}

export function PaymentButton({ groupId, contributionId, amount }: Props) {
  const router = useRouter();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { requestTransactionPin } = useTransactionPin();

  const handlePress = () => {
    void (async () => {
      if (!promptProfileSetupForTransfer(profile, router, t)) return;
      if (!(await requestTransactionPin())) return;
      router.push(`/group/${groupId}/pay?contributionId=${contributionId}`);
    })();
  };

  return <Button title={`Pay ${formatNaira(amount)}`} onPress={handlePress} />;
}
