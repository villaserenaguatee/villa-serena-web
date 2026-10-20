'use client';
import { Minus, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { usePublicLanguage } from './PublicLanguageToggle';
export default function GuestSelector({ adults, childCount, onAdults, onChildren, max = 5, label = 'Huéspedes' }: {
  adults: number;
  childCount: number;
  onAdults: (n: number) => void;
  onChildren: (n: number) => void;
  max?: number;
  label?: string;
}) {
  const { en } = usePublicLanguage();
  const [open, setOpen] = useState(false);
  const total = adults + childCount;
  const canAdd = total < max;
  return <div className="guest-select-control">
    <button type="button" className="guest-select-trigger" onClick={() => setOpen(!open)}>
      <Users size={16} />
      <span>
        {adults}
        {en ? (adults === 1 ? 'adult' : 'adults') : `adulto${adults === 1 ? '' : 's'}`}
        {childCount > 0 ? ` · ${childCount} ${en ? (childCount === 1 ? 'child' : 'childCount') : `niño${childCount === 1 ? '' : 's'}`}` : ''}
      </span>
    </button>
    {open && <div className="guest-popover guest-popover-inline">
      <div>
        <span>
          {en ? 'Adults' : 'Adultos'}
        </span>
        <p>
          <button type="button" onClick={() => onAdults(Math.max(1, adults - 1))}>
            <Minus />
          </button>
          <b>
            {adults}
          </b>
          <button type="button" disabled={!canAdd} onClick={() => canAdd && onAdults(adults + 1)}>
            <Plus />
          </button>
        </p>
      </div>
      <div>
        <span>
          {en ? 'Children' : 'Niños'}
        </span>
        <p>
          <button type="button" onClick={() => onChildren(Math.max(0, childCount - 1))}>
            <Minus />
          </button>
          <b>
            {childCount}
          </b>
          <button type="button" disabled={!canAdd} onClick={() => canAdd && onChildren(childCount + 1)}>
            <Plus />
          </button>
        </p>
      </div>
      <small className="guest-capacity-note">
        {en ? 'Maximum' : 'Máximo'}
        {max}
        {en ? (max === 1 ? 'guest' : 'guests') : `huésped${max === 1 ? '' : 'es'}`}
        {en ? 'in total.' : 'en total.'}
      </small>
      <button type="button" className="guest-confirm" onClick={() => setOpen(false)}>
        {en ? 'Confirm' : 'Confirmar'}
      </button>
    </div>}
  </div>;
}
