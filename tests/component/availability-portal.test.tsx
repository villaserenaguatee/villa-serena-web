import { useState } from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import DateInput from '@/components/common/BilingualDateInput';
import GuestSelector from '@/components/common/GuestSelector';
beforeEach(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }));
afterEach(() => vi.unstubAllGlobals());
function Form() {
  const [value, setValue] = useState('2027-11-14');
  return <div data-testid="scrolling-modal" style={{ overflow: 'hidden' }}><DateInput portal value={value} onChange={setValue} rangeStart="2027-11-10" rangeEnd={value} rangeEdge="departure" min="2027-11-10" minExclusive /><output>{value}</output></div>;
}
test('portal preserves range selection outside the scrolling container and closes with Escape', async () => {
  render(<Form />);
  const trigger = within(screen.getByTestId('scrolling-modal')).getByRole('button');
  await userEvent.click(trigger);
  const dialog = screen.getByRole('dialog');
  expect(screen.getByTestId('scrolling-modal')).not.toContainElement(dialog);
  expect(dialog.querySelector('[data-date="2027-11-10"]')).toBeDisabled();
  await userEvent.click(dialog.querySelector<HTMLButtonElement>('[data-date="2027-11-16"]')!);
  expect(screen.getByRole('status')).toHaveTextContent('2027-11-16');
  await userEvent.click(trigger);
  expect(screen.getByRole('dialog').querySelector('[data-date="2027-11-16"]')).toHaveClass('range-end');
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger).toHaveFocus();
});
test('clicking outside dismisses the portal without changing the selected date', async () => {
  render(<Form />);
  await userEvent.click(within(screen.getByTestId('scrolling-modal')).getByRole('button'));
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('status')).toHaveTextContent('2027-11-14');
});

function Guests() {
  const [adults, setAdults] = useState(1), [children, setChildren] = useState(0);
  return <div data-testid="guests"><GuestSelector portal adults={adults} childCount={children} max={3} onAdults={setAdults} onChildren={setChildren} /><output>{adults}/{children}</output></div>;
}
test('guest portal preserves adult/child minimums, total capacity and committed counts', async () => {
  render(<Guests />);
  await userEvent.click(within(screen.getByTestId('guests')).getByRole('button'));
  const popup = document.querySelector('[data-availability-popover]')!;
  expect(screen.getByTestId('guests')).not.toContainElement(popup as HTMLElement);
  const adults = within(screen.getByText('Adultos').parentElement!).getAllByRole('button');
  const children = within(screen.getByText('Niños').parentElement!).getAllByRole('button');
  await userEvent.click(adults[0]);
  await userEvent.click(children[0]);
  expect(screen.getByRole('status')).toHaveTextContent('1/0');
  await userEvent.click(adults[1]);
  await userEvent.click(children[1]);
  expect(screen.getByRole('status')).toHaveTextContent('2/1');
  expect(adults[1]).toBeDisabled();
  expect(children[1]).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  expect(document.querySelector('[data-availability-popover]')).toBeNull();
  expect(screen.getByRole('status')).toHaveTextContent('2/1');
});
