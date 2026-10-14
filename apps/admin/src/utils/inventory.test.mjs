// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  toPaisa,
  fromPaisa,
  isMoneyInput,
  qtyUnits,
  lineAmountPaisa,
  purchaseLinePaisa,
  purchaseTotalPaisa,
  creditRemainderPaisa,
  purchaseTotals,
  validatePurchaseLine,
  validatePurchaseLines,
  emptyPurchaseLine,
  buildPurchasePayload,
  isLowStock,
  itemStock,
  stockShortfalls,
  validateQtyLine,
  validateAdjustmentLine,
  saleTotalPaisa,
  validateSupplierPayment,
  assetStatusTargets,
  validateDisposalValue,
  refName,
  escapeHtml,
  buildPrintHtml,
} from './inventory.js';

test('toPaisa / fromPaisa round to whole paisa without float drift', () => {
  assert.equal(toPaisa('10.10'), 1010);
  assert.equal(toPaisa(0.1 + 0.2), 30);
  assert.equal(toPaisa('1,250.5'), 125050);
  assert.equal(toPaisa(1.005), 101);
  assert.equal(toPaisa(''), 0);
  assert.equal(toPaisa('abc'), 0);
  assert.equal(toPaisa(null), 0);
  assert.equal(fromPaisa(1010), 10.1);
  assert.equal(fromPaisa(undefined), 0);
});

test('isMoneyInput accepts up to 2 decimals only', () => {
  assert.equal(isMoneyInput('12'), true);
  assert.equal(isMoneyInput('12.5'), true);
  assert.equal(isMoneyInput('12.50'), true);
  assert.equal(isMoneyInput('12.505'), false);
  assert.equal(isMoneyInput('-1'), false);
  assert.equal(isMoneyInput(''), false);
});

test('lineAmountPaisa multiplies fractional quantities exactly', () => {
  assert.equal(qtyUnits('2.5'), 250);
  assert.equal(lineAmountPaisa(3, '33.33'), 9999);
  assert.equal(lineAmountPaisa('2.5', '10.10'), 2525);
  assert.equal(lineAmountPaisa('0.1', '0.3'), 3);
});

test('purchase totals sum all three line kinds in paisa', () => {
  const lines = [
    { kind: 'stock', itemId: 'a', quantity: '3', unitCost: '0.1' },
    { kind: 'asset', name: 'Desk', category: 'Furniture', quantity: '2', unitCost: '0.2' },
    { kind: 'expense', description: 'Freight', amount: '0.3' },
  ];
  assert.equal(purchaseLinePaisa(lines[0]), 30);
  assert.equal(purchaseLinePaisa(lines[2]), 30);
  assert.equal(purchaseTotalPaisa(lines), 100);
  assert.equal(purchaseTotalPaisa([]), 0);
  assert.equal(purchaseLinePaisa(null), 0);
});

test('credit remainder is total − paid, never negative', () => {
  assert.equal(creditRemainderPaisa(10000, 2500), 7500);
  assert.equal(creditRemainderPaisa(10000, 10000), 0);
  assert.equal(creditRemainderPaisa(10000, 12000), 0);
});

test('purchaseTotals flags overpayment', () => {
  const lines = [{ kind: 'expense', description: 'x', amount: '100' }];
  const ok = purchaseTotals(lines, '40.5');
  assert.equal(ok.total, 100);
  assert.equal(ok.paid, 40.5);
  assert.equal(ok.credit, 59.5);
  assert.equal(ok.creditPaisa, 5950);
  assert.equal(ok.paidError, '');
  assert.match(purchaseTotals(lines, '100.01').paidError, /exceed/);
  assert.equal(purchaseTotals(lines, '').credit, 100);
});

test('validatePurchaseLine checks each kind', () => {
  assert.deepEqual(
    validatePurchaseLine({ kind: 'stock', itemId: 'a', quantity: '2.5', unitCost: '10' }),
    {},
  );
  const stock = validatePurchaseLine({ kind: 'stock', itemId: '', quantity: '0', unitCost: '' });
  assert.deepEqual(Object.keys(stock).sort(), ['itemId', 'quantity', 'unitCost']);

  assert.deepEqual(
    validatePurchaseLine({
      kind: 'asset',
      name: 'Projector',
      category: 'IT',
      quantity: '2',
      unitCost: '50000',
      condition: 'new',
    }),
    {},
  );
  const asset = validatePurchaseLine({
    kind: 'asset',
    name: '',
    category: '',
    quantity: '1.5',
    unitCost: '10',
  });
  assert.deepEqual(Object.keys(asset).sort(), ['category', 'name', 'quantity']);
  assert.ok(
    validatePurchaseLine({
      kind: 'asset',
      name: 'a',
      category: 'b',
      quantity: '501',
      unitCost: '1',
    }).quantity,
  );

  assert.deepEqual(validatePurchaseLine({ kind: 'expense', description: 'Fuel', amount: '5' }), {});
  const exp = validatePurchaseLine({ kind: 'expense', description: ' ', amount: '0' });
  assert.deepEqual(Object.keys(exp).sort(), ['amount', 'description']);

  assert.ok(validatePurchaseLine({ kind: 'other' }).kind);
  assert.equal(validatePurchaseLines([emptyPurchaseLine('stock')]).hasErrors, true);
});

test('buildPurchasePayload maps lines and only sends payment fields when paid > 0', () => {
  const values = {
    branchId: 'b1',
    supplierId: 's1',
    date: '2026-10-14',
    billNumber: ' INV-9 ',
    paidAmount: '0',
    paymentMethod: 'bank',
    ledgerAccountId: 'acc',
    lines: [
      { kind: 'stock', itemId: 'i1', quantity: '2', unitCost: '10.5' },
      {
        kind: 'asset',
        name: ' Desk ',
        category: 'Furniture',
        quantity: '3',
        unitCost: '100',
        location: '',
        condition: 'good',
      },
      { kind: 'expense', description: 'Freight', amount: '25' },
    ],
  };
  const credit = buildPurchasePayload(values);
  assert.equal(credit.paidAmount, 0);
  assert.equal(credit.paymentMethod, undefined);
  assert.equal(credit.ledgerAccountId, undefined);
  assert.equal(credit.billNumber, 'INV-9');
  assert.equal(credit.branchId, 'b1');
  assert.deepEqual(credit.lines[0], { kind: 'stock', quantity: 2, unitCost: 10.5, itemId: 'i1' });
  assert.deepEqual(credit.lines[1], {
    kind: 'asset',
    quantity: 3,
    unitCost: 100,
    name: 'Desk',
    category: 'Furniture',
    condition: 'good',
  });
  assert.deepEqual(credit.lines[2], { kind: 'expense', description: 'Freight', amount: 25 });

  const paid = buildPurchasePayload({ ...values, paidAmount: '50', branchId: '' });
  assert.equal(paid.paidAmount, 50);
  assert.equal(paid.paymentMethod, 'bank');
  assert.equal(paid.ledgerAccountId, 'acc');
  assert.equal(paid.branchId, undefined);
});

test('isLowStock: only with a reorder level, at or below it', () => {
  assert.equal(isLowStock(5, 5), true);
  assert.equal(isLowStock(4, 5), true);
  assert.equal(isLowStock(6, 5), false);
  assert.equal(isLowStock(0, 0), false);
  assert.equal(isLowStock(0, undefined), false);
  assert.equal(isLowStock('2.5', '2.5'), true);
});

test('itemStock reads flat or nested stock figures', () => {
  assert.deepEqual(itemStock({ quantity: 3, avgCost: 10, value: 30, lowStock: true }), {
    quantity: 3,
    avgCost: 10,
    value: 30,
    lowStock: true,
  });
  const nested = itemStock({ stock: { quantity: 2, avgCost: 1.5 }, reorderLevel: 5 });
  assert.equal(nested.value, 3);
  assert.equal(nested.lowStock, true);
  assert.equal(itemStock(null).quantity, 0);
});

test('stockShortfalls sums repeated items before comparing', () => {
  const avail = { a: 5, b: 2.5 };
  assert.deepEqual(
    stockShortfalls(
      [
        { itemId: 'a', quantity: '3' },
        { itemId: 'b', quantity: '2.5' },
      ],
      avail,
    ),
    [],
  );
  assert.deepEqual(
    stockShortfalls(
      [
        { itemId: 'a', quantity: '3' },
        { itemId: 'a', quantity: '3' },
        { itemId: 'c', quantity: '1' },
      ],
      avail,
    ),
    [
      { itemId: 'a', requested: 6, available: 5 },
      { itemId: 'c', requested: 1, available: 0 },
    ],
  );
  assert.deepEqual(stockShortfalls([{ itemId: '', quantity: '9' }], avail), []);
});

test('validateQtyLine checks item, quantity and availability', () => {
  assert.deepEqual(validateQtyLine({ itemId: 'a', quantity: '2' }, 2), {});
  assert.match(validateQtyLine({ itemId: 'a', quantity: '3' }, 2).quantity, /Only 2/);
  assert.deepEqual(Object.keys(validateQtyLine({ itemId: '', quantity: '' })).sort(), [
    'itemId',
    'quantity',
  ]);
});

test('validateAdjustmentLine needs a non-zero delta, a reason and enough stock for losses', () => {
  assert.deepEqual(
    validateAdjustmentLine({ itemId: 'a', quantityDelta: '-2', reason: 'x' }, 5),
    {},
  );
  assert.deepEqual(validateAdjustmentLine({ itemId: 'a', quantityDelta: '7', reason: 'x' }, 0), {});
  assert.ok(validateAdjustmentLine({ itemId: 'a', quantityDelta: '0', reason: 'x' }).quantityDelta);
  assert.match(
    validateAdjustmentLine({ itemId: 'a', quantityDelta: '-6', reason: 'x' }, 5).quantityDelta,
    /Only 5/,
  );
  assert.ok(validateAdjustmentLine({ itemId: 'a', quantityDelta: '1', reason: ' ' }).reason);
});

test('saleTotalPaisa', () => {
  assert.equal(
    saleTotalPaisa([
      { quantity: 2, unitPrice: '0.1' },
      { quantity: '1', unitPrice: '0.2' },
    ]),
    40,
  );
  assert.equal(saleTotalPaisa([]), 0);
});

test('validateSupplierPayment caps at the balance (paisa compare)', () => {
  assert.equal(validateSupplierPayment('100', 100), '');
  assert.equal(validateSupplierPayment('0.3', 0.1 + 0.2), '');
  assert.match(validateSupplierPayment('100.01', 100), /exceed/);
  assert.ok(validateSupplierPayment('0', 100));
  assert.ok(validateSupplierPayment('abc', 100));
});

test('assetStatusTargets / validateDisposalValue', () => {
  assert.deepEqual(assetStatusTargets('in-use'), ['in-store', 'under-repair']);
  assert.deepEqual(assetStatusTargets('disposed'), []);
  assert.equal(validateDisposalValue('', 100), '');
  assert.equal(validateDisposalValue('100', 100), '');
  assert.ok(validateDisposalValue('100.01', 100));
  assert.ok(validateDisposalValue('x', 100));
});

test('refName / escapeHtml / buildPrintHtml', () => {
  assert.equal(refName({ user: { name: 'Ali' } }), 'Ali');
  assert.equal(refName('id123'), '—');
  assert.equal(
    escapeHtml('<a href="x">&\'</a>'),
    '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
  );
  const html = buildPrintHtml({
    title: 'Tags <1>',
    subtitle: ['Branch A'],
    headers: ['Tag'],
    rows: [['AST-00001']],
    footer: 'Total 1',
  });
  assert.match(html, /Tags &lt;1&gt;/);
  assert.match(html, /<td>AST-00001<\/td>/);
  assert.match(html, /Total 1/);
});
