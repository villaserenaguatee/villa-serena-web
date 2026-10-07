import { DEMO_ACCOUNT_KEY, initialDemoAccount, type DemoAccount } from '@/lib/mocks/cuenta';

export function readDemoAccount(): DemoAccount {
  const saved = localStorage.getItem(DEMO_ACCOUNT_KEY);
  return saved ? JSON.parse(saved) as DemoAccount : initialDemoAccount();
}
export function saveDemoAccount(account: DemoAccount) {
  // Cuenta, pago y factura se persisten juntos. Si setItem falla, no se publica el nuevo estado.
  localStorage.setItem(DEMO_ACCOUNT_KEY, JSON.stringify(account));
}
