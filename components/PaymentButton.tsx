import { useRouter } from 'expo-router';
import { Button } from './Button';
import { formatNaira } from '@/lib/format';

interface Props {
  groupId: string;
  contributionId: string;
  amount: number;
}

export function PaymentButton({ groupId, contributionId, amount }: Props) {
  const router = useRouter();

  return (
    <Button
      title={`Pay ${formatNaira(amount)}`}
      onPress={() =>
        router.push(`/group/${groupId}/pay?contributionId=${contributionId}`)
      }
    />
  );
}
