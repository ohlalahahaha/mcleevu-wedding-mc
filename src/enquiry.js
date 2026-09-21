export const ENQUIRY_EMAIL = 'mcleevu@gmail.com';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const WORDING = {
  en: {
    subjectBase: 'Wedding MC enquiry',
    greeting: 'Hi Lee,',
    intro: 'We are planning our wedding and would like to enquire about you as our wedding MC.',
    dateLinePrefix: 'Preferred wedding date: ',
    noDateLine: 'Preferred wedding date: to be advised',
    ask: 'Could you please reply to discuss our date and the next steps?',
    signOff: 'Kind regards,'
  },
  vi: {
    subjectBase: 'Hỏi lịch MC đám cưới',
    greeting: 'Chào anh Lê Vũ,',
    intro: 'Chúng tôi đang chuẩn bị đám cưới và muốn mời anh làm MC cho buổi tiệc của chúng tôi.',
    dateLinePrefix: 'Ngày cưới dự kiến: ',
    noDateLine: 'Ngày cưới dự kiến: sẽ báo sau',
    ask: 'Anh có thể trả lời email này để chúng tôi trao đổi thêm về ngày cưới và các bước tiếp theo không?',
    signOff: 'Chân thành cảm ơn,'
  }
};

function formatEnquiryDate(isoDate, lang) {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  try {
    const locale = lang === 'vi' ? 'vi-AU' : 'en-AU';
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  } catch {
    return isoDate;
  }
}

/**
 * Builds the mailto: enquiry link for MC Lee Vu.
 * The chosen date (when provided as YYYY-MM-DD) is included as context only.
 * Returns a fully URL-encoded mailto: URL. No availability/reservation claims
 * are made anywhere in the message — Lee replies personally.
 */
export function buildEnquiryMailto({ date = '', lang = 'en' } = {}) {
  const wording = WORDING[lang] ?? WORDING.en;
  const validDate = typeof date === 'string' && ISO_DATE.test(date) ? date : '';
  const friendly = validDate ? formatEnquiryDate(validDate, lang) : '';
  const subject = validDate ? `${wording.subjectBase} — ${friendly}` : wording.subjectBase;
  const dateLine = validDate ? `${wording.dateLinePrefix}${friendly} (${validDate})` : wording.noDateLine;
  const body = [wording.greeting, '', wording.intro, '', dateLine, '', wording.ask, '', wording.signOff].join('\r\n');
  return `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
