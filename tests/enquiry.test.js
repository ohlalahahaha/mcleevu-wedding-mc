import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEnquiryMailto, ENQUIRY_EMAIL } from '../src/enquiry.js';

const CLAIM_WORDS = /\b(sent|received|available|confirmed|reserved)\b/i;

function parse(href) {
  const url = new URL(href);
  return {
    target: `${url.protocol}${url.pathname}`,
    subject: url.searchParams.get('subject') ?? '',
    body: url.searchParams.get('body') ?? ''
  };
}

test('mailto targets Lee with encoded subject and body, no raw spaces or newlines', () => {
  const href = buildEnquiryMailto({ date: '', lang: 'en' });
  assert.ok(href.startsWith(`mailto:${ENQUIRY_EMAIL}?`));
  assert.ok(!href.includes(' '), 'query must be URL-encoded (no literal spaces)');
  assert.ok(!href.includes('\n') && !href.includes('\r'), 'query must be URL-encoded (no literal newlines)');
  const { subject, body } = parse(href);
  assert.ok(subject.includes('Wedding MC enquiry'));
  assert.ok(body.includes('Hi Lee,'));
  assert.ok(body.length > 40);
});

test('chosen date context is URL-encoded into subject and body', () => {
  const href = buildEnquiryMailto({ date: '2026-10-03', lang: 'en' });
  const { subject, body } = parse(href);
  assert.ok(subject.includes('2026-10-03') || subject.toLowerCase().includes('october'), `subject should carry the date, got: ${subject}`);
  assert.ok(body.includes('2026-10-03'), 'body keeps the ISO date as context');
  assert.ok(body.toLowerCase().includes('october'), 'body includes the friendly date');
  assert.ok(!CLAIM_WORDS.test(subject) && !CLAIM_WORDS.test(body), 'no sent/received/available/confirmed/reserved claims');
});

test('blank date stays valid, honest, and free of date context', () => {
  for (const lang of ['en', 'vi']) {
    const { subject, body } = parse(buildEnquiryMailto({ date: '', lang }));
    assert.ok(subject.length > 0);
    assert.ok(!/\d{4}-\d{2}-\d{2}/.test(body), 'no date presented when none chosen');
    assert.ok(!CLAIM_WORDS.test(subject) && !CLAIM_WORDS.test(body), 'no claims in either language');
  }
  const en = parse(buildEnquiryMailto({ date: '', lang: 'en' }));
  const vi = parse(buildEnquiryMailto({ date: '', lang: 'vi' }));
  assert.ok(/to be advised/i.test(en.body), 'EN body says date is to be advised');
  assert.ok(vi.body.includes('sẽ báo sau'), 'VI body says date will be advised');
});

test('vietnamese variant is a genuine bilingual message', () => {
  const { subject, body } = parse(buildEnquiryMailto({ date: '2026-10-03', lang: 'vi' }));
  assert.ok(subject.includes('MC đám cưới') || subject.includes('Hỏi lịch'), `VI subject, got: ${subject}`);
  assert.ok(body.includes('Chào anh Lê Vũ,'));
  assert.ok(body.includes('Ngày cưới dự kiến'));
  assert.ok(!/đặt cọc/i.test(body), 'no deposit wording in the enquiry email');
});

test('malformed date input is treated exactly as no date', () => {
  assert.equal(buildEnquiryMailto({ date: 'not-a-date', lang: 'en' }), buildEnquiryMailto({ date: '', lang: 'en' }));
  assert.equal(buildEnquiryMailto({ date: null, lang: 'en' }), buildEnquiryMailto({ date: '', lang: 'en' }));
  assert.equal(buildEnquiryMailto({}), buildEnquiryMailto({ date: '', lang: 'en' }));
});

test('deposit and payment instructions are absent from the enquiry email', () => {
  for (const lang of ['en', 'vi']) {
    const { subject, body } = parse(buildEnquiryMailto({ date: '2026-12-05', lang }));
    assert.ok(!/[A$]\s?500/i.test(body) && !/deposit|cọc|checkout|payment/i.test(subject + body));
  }
});
