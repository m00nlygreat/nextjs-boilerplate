/* eslint-env node */
import { test } from 'node:test';
import assert from 'node:assert';
import { transformLinkText } from '@/lib/utils/markdown';

test('replaces link text with paperclip by default', () => {
  const input = 'Check [Google](https://google.com)';
  const output = transformLinkText(input);
  assert.strictEqual(output, 'Check [📎](https://google.com)');
});

test('replaces link text with paw when nyangInjection is true', () => {
  const input = 'Check [Google](https://google.com)';
  const output = transformLinkText(input, true);
  assert.strictEqual(output, 'Check [🐾](https://google.com)');
});
