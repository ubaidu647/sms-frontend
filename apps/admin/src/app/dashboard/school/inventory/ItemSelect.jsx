'use client';
import React from 'react';
import { itemStock } from '@/utils/inventory';
import { fmtQty, money, smallInputCls } from './inventoryShared';

/**
 * Native item dropdown for line editors. `showStock` adds the branch's
 * available quantity, `showPrice` the shop sale price.
 */
export default function ItemSelect({
  items,
  value,
  onChange,
  showStock = false,
  showPrice = false,
  disabled,
  placeholder = 'Select item…',
}) {
  return (
    <select
      value={value || ''}
      disabled={disabled}
      onChange={(e) =>
        onChange(
          e.target.value,
          items.find((i) => i._id === e.target.value),
        )
      }
      className={smallInputCls}
    >
      <option value="">{placeholder}</option>
      {items.map((i) => {
        const st = itemStock(i);
        const extra = [
          showPrice && i.salePrice ? money(i.salePrice) : '',
          showStock ? `${fmtQty(st.quantity)} ${i.unit || ''} available` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <option key={i._id} value={i._id}>
            {i.name}
            {i.sku ? ` (${i.sku})` : ''}
            {extra ? ` — ${extra}` : ''}
          </option>
        );
      })}
    </select>
  );
}

/** item id → available quantity map for stock checks. */
export function availabilityMap(items) {
  const out = {};
  for (const i of items || []) out[i._id] = itemStock(i).quantity;
  return out;
}
