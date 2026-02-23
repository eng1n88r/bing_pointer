const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { randomQuery, WORDS, SEARCHES_PER_MODE, DELAY_MS } = require('../bin/bing-pointer');

describe('WORDS', () => {
  it('is a non-empty array', () => {
    assert.ok(Array.isArray(WORDS));
    assert.ok(WORDS.length > 0);
  });

  it('contains only lowercase non-empty strings', () => {
    for (const word of WORDS) {
      assert.equal(typeof word, 'string');
      assert.ok(word.length > 0, `empty string found in WORDS`);
      assert.equal(word, word.toLowerCase(), `"${word}" is not lowercase`);
    }
  });
});

describe('randomQuery()', () => {
  it('returns a string matching "word word number" format', () => {
    const query = randomQuery();
    const parts = query.split(' ');
    assert.equal(parts.length, 3);
    assert.ok(WORDS.includes(parts[0]), `"${parts[0]}" not in WORDS`);
    assert.ok(WORDS.includes(parts[1]), `"${parts[1]}" not in WORDS`);
    const num = Number(parts[2]);
    assert.ok(Number.isInteger(num), `"${parts[2]}" is not an integer`);
    assert.ok(num >= 0 && num <= 9999, `${num} out of range 0-9999`);
  });

  it('produces different results across multiple calls', () => {
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(randomQuery());
    }
    assert.ok(results.size > 1, 'all 20 calls returned the same query');
  });
});

describe('constants', () => {
  it('SEARCHES_PER_MODE is 35', () => {
    assert.equal(SEARCHES_PER_MODE, 35);
  });

  it('DELAY_MS is 2000', () => {
    assert.equal(DELAY_MS, 2000);
  });
});
