import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  offerSlotsLeft,
  offerAvailable,
  startPrice,
  offerChip,
  livePriceLock,
  renewalPrice,
  launchOfferToForm,
  launchOfferFromForm,
} from './launchOffer.js';

const fmt = (n) => `Rs ${Number(n).toLocaleString('en-US')}`;
const pkg = (offer) => ({ price: 5000, launchOffer: offer });

test('an offer is available while active with slots left', () => {
  const offer = { active: true, price: 3500, maxSchools: 30, lockDays: 365, claimed: 27 };
  assert.equal(offerSlotsLeft(offer), 3);
  assert.equal(offerAvailable(pkg(offer)), true);
  assert.equal(offerAvailable(pkg({ ...offer, claimed: 30 })), false);
  assert.equal(offerAvailable(pkg({ ...offer, active: false })), false);
  assert.equal(offerAvailable(pkg(null)), false);
  assert.equal(offerAvailable(null), false);
});

test('start price uses the offer only when it applies and is wanted', () => {
  const offer = { active: true, price: 3500, maxSchools: 30, claimed: 0 };
  assert.equal(startPrice(pkg(offer)), 3500);
  assert.equal(startPrice(pkg(offer), false), 5000);
  assert.equal(startPrice(pkg({ ...offer, claimed: 30 })), 5000);
  assert.equal(startPrice(null), null);
});

test('offer chip shows price and slots left', () => {
  const offer = { active: true, price: 3500, maxSchools: 30, claimed: 27 };
  assert.equal(offerChip(pkg(offer), fmt), 'Offer: Rs 3,500 · 3/30 left');
  assert.equal(
    offerChip(pkg({ ...offer, claimed: 30 }), fmt),
    'Offer: Rs 3,500 · 0/30 left · full',
  );
  assert.equal(
    offerChip(pkg({ ...offer, active: false }), fmt),
    'Offer: Rs 3,500 · 3/30 left · paused',
  );
  assert.equal(offerChip(pkg(null), fmt), null);
});

test('renewal keeps the locked price only while the lock runs', () => {
  const now = Date.UTC(2026, 0, 1);
  const sub = {
    packageSnapshot: { price: 3500 },
    priceLock: { price: 3500, until: new Date(now + 1000).toISOString() },
  };
  assert.deepEqual(livePriceLock(sub, now), { price: 3500, until: now + 1000 });
  assert.equal(renewalPrice({ current: sub, catalogPrice: 5000, nowMs: now }), 3500);
  assert.equal(renewalPrice({ current: sub, catalogPrice: 5000, nowMs: now + 2000 }), 5000);
  assert.equal(livePriceLock({ priceLock: null }, now), null);
  assert.equal(renewalPrice({ current: { packageSnapshot: { price: 4000 } }, nowMs: now }), 4000);
});

test('launch offer form round-trips and validates', () => {
  const form = launchOfferToForm(
    pkg({ active: false, price: 3500, maxSchools: 30, lockDays: 365, claimed: 4 }),
  );
  assert.deepEqual(form, {
    offerOn: true,
    offerActive: false,
    offerPrice: '3500',
    offerMaxSchools: '30',
    offerLockDays: '365',
  });
  assert.deepEqual(launchOfferFromForm(form), {
    value: { active: false, price: 3500, maxSchools: 30, lockDays: 365 },
  });
  assert.equal(launchOfferToForm(null).offerOn, false);
  assert.deepEqual(launchOfferFromForm({ ...form, offerOn: false }), { value: null });
  assert.equal(launchOfferFromForm({ ...form, offerPrice: '' }).field, 'offerPrice');
  assert.equal(launchOfferFromForm({ ...form, offerMaxSchools: '0' }).field, 'offerMaxSchools');
  assert.equal(launchOfferFromForm({ ...form, offerLockDays: '1.5' }).field, 'offerLockDays');
  assert.equal(launchOfferFromForm({ ...form, offerLockDays: '4000' }).field, 'offerLockDays');
});

import { launchOfferPayload } from './launchOffer.js';

test('launchOffer: false is sent only when an applicable offer is unticked', () => {
  const offer = { active: true, price: 3500, maxSchools: 30, claimed: 0 };
  assert.deepEqual(launchOfferPayload(pkg(offer), false), { launchOffer: false });
  assert.deepEqual(launchOfferPayload(pkg(offer), true), {});
  assert.deepEqual(launchOfferPayload(pkg({ ...offer, claimed: 30 }), false), {});
  assert.deepEqual(launchOfferPayload(null, false), {});
});
