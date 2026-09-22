import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const HEALTH_LINK = 'https://business.fairfieldcity.nsw.gov.au/Business-Directory/Acoustic-Hearing-Care';
const REEL_SRC = '/media/lee-vu-reel.mp4';
const REEL_HTML = '/lee-vu-reel.html';
const STAGE_IMG = '/media/lee-vu-stage-2x.jpg';

const COPY = {
  en: {
    pageTitle: 'Vietnamese & English Wedding MC Sydney | MC Lee Vu',
    pageDescription: 'MC Lee Vu is a Sydney wedding MC hosting in English and Vietnamese since 2006. Enquire with Lee about your wedding date.',
    eyebrow: 'Sydney · English + Vietnamese',
    heroLines: ['Bilingual', 'wedding MC', <>in <em className="gold-text">Sydney.</em></>],
    lede: 'Since 2006, Lee Vu has hosted weddings in English and Vietnamese, guiding the run sheet, the room and the moments that matter.',
    cta1: 'Enquire with Lee', cta2: 'Watch Lee in action',
    note: 'More than just a MC',
    w1: 'People', w2: 'Stories', w3: 'Cultures', w4: 'Love',
    cue: 'Scroll',
    m1: 'Home', m2: 'The Reel', m3: 'Beyond the Mic', m4: 'Enquire',
    menuTag: 'Sydney · English + Vietnamese',
    reelEyebrow: 'A short reel',
    reelTitle: <>Real moments.<br />Lasting memories.</>,
    reelMeta: 'Short reel',
    g1: 'Weddings', g2: 'People', g3: 'Connection', g4: 'Sydney',
    pEyebrow: 'Beyond the microphone', pTitle: 'A Greater Purpose',
    pBody: 'Away from the microphone, Lee works in optometry and audiology and has spent years supporting Sydney’s Vietnamese community.',
    pLink: 'Acoustic Hearing Care',
    quote: <><span className="q">“</span>Different conversations. A&nbsp;shared purpose.<span className="q">”</span></>,
    cap: 'Sydney Always Home',
    portraitAlt: 'Lee Vu in a bright blue blazer, photographed on a Sydney street',
    enquireEyebrow: 'Est. 2006 · Sydney',
    footEyebrow: 'Est. 2006 · Sydney', footName: 'Lee Vu',
    footSub: 'Bilingual wedding MC — Sydney', footCta: 'Enquire with Lee',
    footWords: 'People · Stories · Cultures · Love',
    footRights: '© 2026 Lee Vu · MC · Sydney, Australia', footTop: 'Back to top',
    modalLabel: 'Showreel', modalSub: 'Showreel', modalSoon: 'Full showreel available on request',
    faqHeading: 'Before you enquire',
    skip: 'Skip to content',
    availabilityTitle: 'Check your wedding date', availabilityBody: 'Choose your date. If Lee is available, you can continue with your details.',
    selectDate: 'Wedding date', checkDate: 'Check date', checking: 'Checking…',
    available: 'Lee is available on this date.', availableBody: 'Continue with your details to secure the date with the A$500 deposit.',
    held: 'This date is temporarily held.', unavailable: 'Lee is already booked on this date.', unavailableBody: 'Choose another date or contact Lee directly.',
    serviceUnavailable: 'Online date checking is unavailable.', serviceUnavailableBody: 'Contact Lee directly while the booking connection is unavailable.',
    checkingError: 'The date could not be checked. Try again or contact Lee directly.',
    detailsTitle: 'Wedding details', yourName: 'Your name', partnerName: 'Partner name', email: 'Email', phone: 'Phone', venue: 'Venue name', venueAddress: 'Venue address',
    language: 'Hosting language', languageOptions: ['English + Vietnamese', 'English', 'Vietnamese'], notes: 'Notes for Lee',
    summaryTitle: 'Booking summary', dueToday: 'Due today', remaining: 'Remaining',
    total: 'A$1,000 total', coverage: 'From 6:00 PM until the reception concludes.', deposit: 'A$500 booking deposit', balance: 'A$500 remaining balance',
    pay: 'Pay A$500 deposit', paying: 'Opening checkout…',
    stripeNote: 'Your date is confirmed after the deposit payment succeeds.',
    formError: 'Complete the required details and try again.',
    checkoutError: 'Checkout could not be opened. Try again or contact Lee directly.',
    returnSuccess: 'Your wedding date is confirmed.', returnSuccessBody: 'Your A$500 deposit has been received. Lee will contact you about the next steps.',
    returnPending: 'Payment is being confirmed.', returnPendingBody: 'Please wait while the booking confirmation completes.',
    returnCancelled: 'Checkout was cancelled.', returnCancelledBody: 'Your date is not confirmed. Recheck the date before trying again.',
    resume: 'Recheck date', phoneLabel: 'Phone', emailLabel: 'Email',
    contactBody: 'Tell Lee your date, venue and what matters to both families.',
    faqs: [
      ['Can Lee host in English and Vietnamese?', 'Yes. Lee can host in English, Vietnamese or combine both during the reception.'],
      ['What hours are included?', 'Wedding reception hosting runs from 6:00 PM until the reception concludes.'],
      ['How is the date secured?', 'After the date is confirmed available, the booking is secured when the A$500 deposit payment succeeds.']
    ]
  },
  vi: {
    pageTitle: 'MC Đám Cưới Song Ngữ Sydney | MC Lê Vũ',
    pageDescription: 'MC Lê Vũ dẫn tiệc cưới bằng tiếng Anh và tiếng Việt tại Sydney từ năm 2006. Liên hệ với Lê Vũ về ngày cưới của bạn.',
    eyebrow: 'Sydney · Tiếng Anh + Tiếng Việt',
    heroLines: ['MC đám cưới', 'song ngữ tại', <em className="gold-text">Sydney.</em>],
    lede: 'Từ năm 2006, Lê Vũ dẫn tiệc cưới bằng tiếng Anh và tiếng Việt, giữ nhịp chương trình và những khoảnh khắc quan trọng của hai gia đình.',
    cta1: 'Liên hệ với Lee', cta2: 'Xem Lee trên sân khấu',
    note: 'Hơn cả một MC',
    w1: 'Con người', w2: 'Câu chuyện', w3: 'Văn hoá', w4: 'Tình yêu',
    cue: 'Cuộn',
    m1: 'Trang chủ', m2: 'Reel', m3: 'Hơn cả micro', m4: 'Liên hệ',
    menuTag: 'Sydney · Tiếng Anh + Tiếng Việt',
    reelEyebrow: 'Đoạn reel ngắn',
    reelTitle: <>Khoảnh khắc thật.<br />Ký ức mãi không phai.</>,
    reelMeta: 'Reel ngắn',
    g1: 'Đám cưới', g2: 'Con người', g3: 'Kết nối', g4: 'Sydney',
    pEyebrow: 'Xa chiếc micro', pTitle: 'Một sứ mệnh lớn hơn',
    pBody: 'Xa chiếc micro, Lee làm việc trong ngành nhãn khoa và thính học, và đã dành nhiều năm đồng hành cùng cộng đồng người Việt tại Sydney.',
    pLink: 'Acoustic Hearing Care',
    quote: <><span className="q">“</span>Những cuộc trò chuyện khác biệt. Một&nbsp;sứ mệnh chung.<span className="q">”</span></>,
    cap: 'Sydney luôn là nhà',
    portraitAlt: 'Lee Vu mặc áo blazer xanh dương, chụp trên phố Sydney',
    enquireEyebrow: 'Từ 2006 · Sydney',
    footEyebrow: 'Từ 2006 · Sydney', footName: 'Lee Vu',
    footSub: 'MC đám cưới song ngữ — Sydney', footCta: 'Liên hệ với Lee',
    footWords: 'Con người · Câu chuyện · Văn hoá · Tình yêu',
    footRights: '© 2026 Lee Vu · MC · Sydney, Úc', footTop: 'Lên đầu trang',
    modalLabel: 'Reel', modalSub: 'Reel', modalSoon: 'Bản đầy đủ — liên hệ Lee',
    faqHeading: 'Trước khi liên hệ',
    skip: 'Tới nội dung chính',
    availabilityTitle: 'Kiểm tra ngày cưới', availabilityBody: 'Chọn ngày cưới. Nếu Lê Vũ còn lịch, bạn có thể tiếp tục điền thông tin.',
    selectDate: 'Ngày cưới', checkDate: 'Kiểm tra ngày', checking: 'Đang kiểm tra…',
    available: 'Lê Vũ còn lịch ngày này.', availableBody: 'Tiếp tục điền thông tin để giữ ngày bằng khoản đặt cọc A$500.',
    held: 'Ngày này đang được tạm giữ.', unavailable: 'Lê Vũ đã có lịch ngày này.', unavailableBody: 'Chọn ngày khác hoặc liên hệ trực tiếp với Lê Vũ.',
    serviceUnavailable: 'Hiện chưa thể kiểm tra ngày trực tuyến.', serviceUnavailableBody: 'Vui lòng liên hệ trực tiếp với Lê Vũ trong lúc hệ thống đặt lịch chưa kết nối.',
    checkingError: 'Chưa thể kiểm tra ngày. Vui lòng thử lại hoặc liên hệ trực tiếp.',
    detailsTitle: 'Thông tin tiệc cưới', yourName: 'Tên của bạn', partnerName: 'Tên người bạn đời', email: 'Email', phone: 'Điện thoại', venue: 'Tên địa điểm', venueAddress: 'Địa chỉ địa điểm',
    language: 'Ngôn ngữ dẫn', languageOptions: ['Anh + Việt', 'Tiếng Anh', 'Tiếng Việt'], notes: 'Ghi chú cho Lê Vũ',
    summaryTitle: 'Thông tin đặt lịch', dueToday: 'Thanh toán hôm nay', remaining: 'Còn lại',
    total: 'Tổng phí A$1,000', coverage: 'Từ 6:00 tối đến khi tiệc kết thúc.', deposit: 'Đặt cọc A$500', balance: 'Còn lại A$500',
    pay: 'Đặt cọc A$500', paying: 'Đang mở thanh toán…',
    stripeNote: 'Ngày cưới được xác nhận sau khi thanh toán đặt cọc thành công.',
    formError: 'Vui lòng điền các thông tin bắt buộc.',
    checkoutError: 'Chưa thể mở trang thanh toán. Vui lòng thử lại hoặc liên hệ Lê Vũ.',
    returnSuccess: 'Ngày cưới đã được xác nhận.', returnSuccessBody: 'Khoản đặt cọc A$500 đã được nhận. Lê Vũ sẽ liên hệ về các bước tiếp theo.',
    returnPending: 'Đang xác nhận thanh toán.', returnPendingBody: 'Vui lòng chờ trong khi hệ thống xác nhận đặt lịch.',
    returnCancelled: 'Đã huỷ thanh toán.', returnCancelledBody: 'Ngày cưới của bạn chưa được xác nhận. Hãy kiểm tra lại ngày trước khi thử lại.',
    resume: 'Kiểm tra lại ngày', phoneLabel: 'Điện thoại', emailLabel: 'Email',
    contactBody: 'Chia sẻ ngày cưới, địa điểm và những điều quan trọng với hai gia đình.',
    faqs: [
      ['Lê Vũ có thể dẫn bằng cả tiếng Anh và tiếng Việt không?', 'Có. Lê Vũ có thể dẫn bằng tiếng Anh, tiếng Việt hoặc kết hợp cả hai trong buổi tiệc.'],
      ['Thời gian dẫn chương trình là bao lâu?', 'Phần dẫn tiệc cưới bắt đầu từ 6:00 tối và kéo dài đến khi tiệc kết thúc.'],
      ['Khi nào ngày cưới được giữ?', 'Sau khi ngày được xác nhận còn trống, lịch được giữ khi khoản đặt cọc A$500 thanh toán thành công.']
    ]
  }
};


function Availability({ t }) {
  const [date, setDate] = useState(''); const [status, setStatus] = useState('idle'); const [message, setMessage] = useState(''); const [detailsOpen, setDetailsOpen] = useState(false); const [submitting, setSubmitting] = useState(false); const errorRef = useRef(null);
  const minDate = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const booking = params.get('booking'); const id = params.get('booking_id');
    if (!['success', 'cancelled'].includes(booking)) return;
    let active = true; let timer;
    const check = async (attempt = 0) => {
      if (booking === 'cancelled') {
        if (id) { try { const r = await fetch('/api/booking-status?id=' + encodeURIComponent(id), { headers: { accept: 'application/json' } }); const d = await r.json().catch(() => ({})); if (active && r.ok && d.event_date) setDate(d.event_date) } catch { /* cancelled state remains truthful without booking details */ } }
        if (active) setStatus('return-cancelled'); return;
      }
      if (!id) { if (active) setStatus('return-pending'); return }
      try {
        const r = await fetch('/api/booking-status?id=' + encodeURIComponent(id), { headers: { accept: 'application/json' } }); const d = await r.json().catch(() => ({}));
        if (!active) return;
        if (r.ok && d.status === 'confirmed' && d.deposit_status === 'paid') { setStatus('return-confirmed'); return }
        setStatus('return-pending');
      } catch { if (active) setStatus('return-pending') }
      if (active && attempt < 9) timer = setTimeout(() => check(attempt + 1), 2000);
    };
    check(); return () => { active = false; clearTimeout(timer) };
  }, []);
  useEffect(() => { if (message) errorRef.current?.focus() }, [message]);
  const checkDate = async () => {
    if (!date) return; setStatus('checking'); setDetailsOpen(false); setMessage('');
    try {
      const r = await fetch('/api/availability?date=' + encodeURIComponent(date), { headers: { accept: 'application/json' } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !['available', 'held', 'unavailable'].includes(d.status)) throw new Error();
      setStatus(d.status);
    } catch { setStatus('service-unavailable') }
  };
  const submitBooking = async (e) => {
    e.preventDefault(); if (!e.currentTarget.reportValidity()) { setMessage(t.formError); return }
    setSubmitting(true); setMessage('');
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries()); payload.eventDate = date;
    try {
      const r = await fetch('/api/create-checkout', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error();
      window.location.assign(d.url);
    } catch { setMessage(t.checkoutError) } finally { setSubmitting(false) }
  };
  const returnState = status.startsWith('return-') && <div className={'return-state ' + status} role="status"><strong>{status === 'return-confirmed' ? t.returnSuccess : status === 'return-pending' ? t.returnPending : t.returnCancelled}</strong><span>{status === 'return-confirmed' ? t.returnSuccessBody : status === 'return-pending' ? t.returnPendingBody : t.returnCancelledBody}</span>{status === 'return-cancelled' && <button className="text-button" type="button" onClick={() => { setStatus('idle'); setDetailsOpen(false); requestAnimationFrame(() => document.querySelector('#wedding-date')?.focus()) }}>{t.resume}</button>}</div>;
  return <div className="availability-card">
    {returnState}
    <div className="date-checker"><label htmlFor="wedding-date">{t.selectDate}</label><div className="date-row"><input id="wedding-date" type="date" min={minDate} value={date} onChange={e => { setDate(e.target.value); setStatus('idle'); setDetailsOpen(false) }} /><button className="btn btn-gold" type="button" onClick={checkDate} disabled={!date || status === 'checking'}>{status === 'checking' ? t.checking : t.checkDate}</button></div></div>
    {status === 'available' && <div className="availability-result success" role="status"><strong>{t.available}</strong><span>{t.availableBody}</span><button className="text-button" type="button" onClick={() => setDetailsOpen(true)}>{t.cta1}</button></div>}
    {['held', 'unavailable'].includes(status) && <div className="availability-result neutral" role="status"><strong>{status === 'held' ? t.held : t.unavailable}</strong><span>{t.unavailableBody}</span></div>}
    {status === 'service-unavailable' && <div className="availability-result neutral" role="status"><strong>{t.serviceUnavailable}</strong><span>{t.serviceUnavailableBody}</span><a className="text-button" href="mailto:mcleevu@gmail.com">mcleevu@gmail.com</a></div>}
    {detailsOpen && status === 'available' && <form className="booking-form" onSubmit={submitBooking} noValidate><div className="form-heading"><h3>{t.detailsTitle}</h3></div><div className="form-grid"><label><span>{t.yourName}</span><input name="customerName" autoComplete="name" required maxLength="100" /></label><label><span>{t.partnerName}</span><input name="partnerName" autoComplete="name" required maxLength="100" /></label><label><span>{t.email}</span><input name="email" type="email" autoComplete="email" required maxLength="160" /></label><label><span>{t.phone}</span><input name="phone" type="tel" autoComplete="tel" required maxLength="40" /></label><label><span>{t.venue}</span><input name="venueName" maxLength="160" /></label><label><span>{t.venueAddress}</span><input name="venueAddress" autoComplete="street-address" maxLength="240" /></label><label className="full"><span>{t.language}</span><select name="languagePreference" defaultValue="bilingual"><option value="bilingual">{t.languageOptions[0]}</option><option value="english">{t.languageOptions[1]}</option><option value="vietnamese">{t.languageOptions[2]}</option></select></label><label className="full"><span>{t.notes}</span><textarea name="notes" rows="4" maxLength="1200" /></label></div><div className="checkout-summary"><div><p className="eyebrow eyebrow--dark">{t.summaryTitle}</p><strong>{date}</strong><span>{t.coverage}</span></div><dl><div><dt>{t.total}</dt><dd>A$1,000</dd></div><div><dt>{t.dueToday}</dt><dd>A$500</dd></div><div><dt>{t.remaining}</dt><dd>A$500</dd></div></dl><button className="btn btn-gold button-wide" type="submit" disabled={submitting}>{submitting ? t.paying : t.pay}</button><p className="stripe-note">{t.stripeNote}</p></div></form>}
    {message && <p className="form-error" role="alert" tabIndex="-1" ref={errorRef}>{message}</p>}
  </div>;
}


function IcArrow(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h17M15 6l6 6-6 6"></path></svg>;}
function IcPlayCircle(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M10 8.8v6.4L15.5 12z" fill="currentColor" stroke="none"></path></svg>;}

function FilmModal({ open, onClose, label, sub, soon }) {
  const videoRef = useRef(null); const seekRef = useRef(null); const timeRef = useRef(null); const stageRef = useRef(null); const closeRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const fmt = (s) => { if (!isFinite(s)) s = 0; const m = Math.floor(s / 60); const r = Math.floor(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; };
  const updateUI = () => {
    const v = videoRef.current; if (!v || !seekRef.current) return;
    const d = v.duration || 0, c = v.currentTime || 0;
    const pct = d ? (c / d) * 100 : 0;
    seekRef.current.value = d ? Math.round((c / d) * 1000) : 0;
    seekRef.current.style.background = 'linear-gradient(90deg, var(--gold) ' + pct + '%, rgba(231,210,162,.25) ' + pct + '%)';
    if (timeRef.current) timeRef.current.textContent = fmt(c) + ' / ' + fmt(d);
  };
  useEffect(() => {
    if (open) {
      document.body.classList.add('no-scroll');
      const v = videoRef.current;
      if (v && !v.getAttribute('src')) v.setAttribute('src', REEL_SRC);
      closeRef.current?.focus();
    } else {
      document.body.classList.remove('no-scroll');
      const v = videoRef.current;
      if (v && !v.paused) v.pause();
    }
  }, [open]);
  const toggleFull = () => {
    const s = stageRef.current;
    if (document.fullscreenElement) { document.exitFullscreen(); }
    else if (s && s.requestFullscreen) { s.requestFullscreen(); }
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      const v = videoRef.current; if (!v || !v.getAttribute('src')) return;
      if (e.key === ' ') { e.preventDefault(); if (v.paused) { v.play(); } else { v.pause(); } }
      if (e.key === 'ArrowRight' && v.duration) { v.currentTime = Math.min(v.duration, v.currentTime + 5); }
      if (e.key === 'ArrowLeft' && v.duration) { v.currentTime = Math.max(0, v.currentTime - 5); }
      if (e.key === 'm' || e.key === 'M') { v.muted = !v.muted; setMuted(v.muted); }
      if (e.key === 'f' || e.key === 'F') { toggleFull(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <div className={'modal' + (open ? ' open' : '')} id="film" aria-hidden={!open}>
      <div className="modal-backdrop" onClick={onClose}></div>
      <figure className="modal-box" role="dialog" aria-modal="true" aria-label={label}>
        <button className="modal-close" ref={closeRef} type="button" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"></path></svg>
        </button>
        <div className={'modal-stage can-play ' + (playing ? 'is-playing' : 'is-paused') + (started ? ' has-started' : '')} ref={stageRef}>
          <video ref={videoRef} playsInline preload="metadata" onLoadedMetadata={updateUI} onTimeUpdate={updateUI} onPlay={() => { setPlaying(true); setStarted(true); }} onPause={() => setPlaying(false)} onEnded={() => { const v = videoRef.current; if (v) { v.currentTime = 0; updateUI(); } }}></video>
          <div className="v-poster" style={{ backgroundImage: 'linear-gradient(180deg,rgba(8,13,21,.35),rgba(8,13,21,.55)),url(' + STAGE_IMG + ')', backgroundSize: 'cover', backgroundPosition: '62% 20%' }}>
            <div className="stage-label">
              <span className="stage-script gold-text">Lee Vu</span>
              <span className="stage-sub">{sub}</span>
              <span className="stage-soon">{soon}</span>
            </div>
          </div>
          <button className="v-bigplay" type="button" onClick={() => videoRef.current?.play()} aria-label={label}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"></path></svg>
          </button>
          <div className="v-controls">
            <button className="vbtn" type="button" onClick={() => { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); } else { v.pause(); } }} aria-label={playing ? 'Pause' : 'Play'}>
              <svg viewBox="0 0 24 24" aria-hidden="true" hidden={!playing}><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"></path></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true" hidden={playing}><path d="M8 5.2v13.6L19 12z"></path></svg>
            </button>
            <input type="range" id="vSeek" ref={seekRef} min="0" max="1000" defaultValue="0" step="1" aria-label="Seek" onChange={() => { const v = videoRef.current; if (v && v.duration) { v.currentTime = (seekRef.current.value / 1000) * v.duration; updateUI(); } }} />
            <span id="vTime" ref={timeRef}>0:00 / 0:00</span>
            <button className="vbtn" type="button" onClick={() => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }} aria-label={muted ? 'Unmute' : 'Mute'}>
              <svg viewBox="0 0 24 24" aria-hidden="true" hidden={muted}><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a3.5 3.5 0 0 0-2-3.15v6.3a3.5 3.5 0 0 0 2-3.15zm-2-7v2.1a5 5 0 0 1 0 9.8V19a7 7 0 0 0 0-14z"></path></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true" hidden={!muted}><path d="M4 9v6h4l5 4V5L8 9H4zm12 .8 1.4-1.4 1.6 1.6 1.6-1.6L22 9.8 20.4 11.4 22 13l-1.4 1.4-1.6-1.6-1.6 1.6L16 13l1.6-1.6L16 9.8z"></path></svg>
            </button>
            <button className="vbtn" type="button" onClick={toggleFull} aria-label="Fullscreen">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"></path></svg>
            </button>
          </div>
        </div>
      </figure>
    </div>
  );
}

function App() {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [lang, setLangState] = useState('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef(null);
  const filmTriggerRef = useRef(null);
  const revealedRef = useRef(new WeakSet());
  const [platesHidden, setPlatesHidden] = useState({});
  const hidePlate = (k) => setPlatesHidden(s => (s[k] ? s : Object.assign({}, s, { [k]: true })));
  const t = COPY[lang];
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setLang = (next) => {
    if (next === lang) return;
    if (reduced()) { setLangState(next); return; }
    document.body.classList.add('lang-switching');
    setTimeout(() => { setLangState(next); document.body.classList.remove('lang-switching'); }, 180);
  };
  const scrollToEnquire = () => {
    setMenuOpen(false);
    document.querySelector('#enquire')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  };
  const openFilm = () => {
    filmTriggerRef.current = document.activeElement;
    setMenuOpen(false);
    setFilmOpen(true);
  };
  const closeFilm = () => {
    setFilmOpen(false);
    if (filmTriggerRef.current && filmTriggerRef.current.focus) filmTriggerRef.current.focus();
  };
  useEffect(() => {
    document.documentElement.lang = lang === 'vi' ? 'vi-AU' : 'en-AU';
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.pageDescription);
  }, [lang, t]);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { document.body.classList.toggle('menu-open', menuOpen); }, [menuOpen]);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal,.reveal-x,.reveal-clip,.collage-main .frame'));
    els.forEach(el => { if (revealedRef.current.has(el)) el.classList.add('in'); });
    const pending = els.filter(el => !revealedRef.current.has(el));
    if (reduced() || !('IntersectionObserver' in window)) { pending.forEach(el => { el.classList.add('in'); revealedRef.current.add(el); }); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealedRef.current.add(en.target); io.unobserve(en.target); } });
    }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });
    pending.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [lang]);
  useEffect(() => {
    if (reduced()) return;
    const media = document.querySelector('.hero-media');
    if (!media) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, window.innerHeight);
          media.style.transform = 'translate3d(0,' + (y * .18) + 'px,0)';
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && menuOpen) setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);
  return <>
    <a className="skip-link" href="#main">{t.skip}</a>
    <div className="scroll-progress" aria-hidden="true" ref={progressRef}></div>
    <div className="grain" aria-hidden="true"></div>
    <header className={'site-head' + (scrolled ? ' scrolled' : '')}>
      <div className="head-inner">
        <a className="brand" href="#top">MC&nbsp;Lee&nbsp;Vu</a>
        <div className="head-right">
          <div className="lang" role="group" aria-label="Language">
            <button className={'lang-btn' + (lang === 'en' ? ' is-active' : '')} type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
            <span className="lang-sep" aria-hidden="true"></span>
            <button className={'lang-btn' + (lang === 'vi' ? ' is-active' : '')} type="button" onClick={() => setLang('vi')} aria-pressed={lang === 'vi'}>VI</button>
          </div>
          <button className="menu-btn" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="menu" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span><span></span>
          </button>
        </div>
      </div>
    </header>
    <div className="menu-overlay" id="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!menuOpen}>
      <nav className="menu-nav">
        <a href="#top" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}><i>01</i><span>{t.m1}</span></a>
        <a href="#reel" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}><i>02</i><span>{t.m2}</span></a>
        <a href="#purpose" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}><i>03</i><span>{t.m3}</span></a>
        <a href="#enquire" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}><i>04</i><span>{t.m4}</span></a>
      </nav>
      <div className="menu-foot">
        <span>{t.menuTag}</span>
        <span>Est. 2006</span>
      </div>
    </div>
    <main id="top">
      <span id="main" className="anchor-main" aria-hidden="true"></span>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true">
          <div className={"ph ph--hero" + (platesHidden.hero ? " ph-done" : "")} aria-hidden="true"><span className="ph-mark">LEE&nbsp;VU</span></div>
          <img className="media-img kb" src={STAGE_IMG} onLoad={(e) => { e.currentTarget.classList.add('loaded'); hidePlate('hero'); }} alt="" fetchPriority="high" decoding="async" />
          <span className="tone" aria-hidden="true"></span>
          <div className="bokeh" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div className="hero-shade" aria-hidden="true"></div>
        <svg className="hero-arc" viewBox="0 0 380 190" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="arcGold" x1="0" y1="190" x2="380" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9a7a3f"></stop><stop offset=".55" stopColor="#e7d2a2"></stop><stop offset="1" stopColor="#c8a45f"></stop>
            </linearGradient>
          </defs>
          <path d="M14 176 Q160 -34 366 140" stroke="url(#arcGold)" strokeWidth="1.4" strokeLinecap="round"></path>
          <circle cx="366" cy="140" r="2.2" fill="#e7d2a2"></circle>
        </svg>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow fade-up d1">{t.eyebrow}</p>
            <h1 className="hero-title" id="hero-title">
              {t.heroLines.map((line, i) => <span className="line" key={i}><span className="line-inner" style={{ animationDelay: (.35 + i * .18) + 's' }}>{line}</span></span>)}
            </h1>
            <span className="rule" aria-hidden="true"></span>
            <p className="hero-lede fade-up d2">{t.lede}</p>
            <div className="hero-cta fade-up d3">
              <button className="btn btn-gold" type="button" onClick={scrollToEnquire}><span>{t.cta1}</span><IcArrow /></button>
              <button className="btn btn-ghost" type="button" onClick={openFilm}><IcPlayCircle /><span>{t.cta2}</span></button>
            </div>
          </div>
          <aside className="hero-note fade-up d4">
            <p className="script-note gold-text">{t.note}</p>
            <span className="note-rule" aria-hidden="true"></span>
            <ul className="word-stack">{[t.w1, t.w2, t.w3, t.w4].map(w => <li key={w}>{w}</li>)}</ul>
          </aside>
        </div>
        <a className="scroll-cue" href="#reel"><span className="cue-label">{t.cue}</span><span className="cue-line" aria-hidden="true"></span></a>
      </section>
      <section className="reel" id="reel" aria-labelledby="reel-title">
        <div className="reel-card reveal">
          <span className="tick tick--tl" aria-hidden="true"></span>
          <span className="tick tick--tr" aria-hidden="true"></span>
          <span className="tick tick--bl" aria-hidden="true"></span>
          <span className="tick tick--br" aria-hidden="true"></span>
          <div className="reel-media" aria-hidden="true">
            {!prefersReduced && <div className={"ph ph--hero" + (platesHidden.candid ? " ph-done" : "")} aria-hidden="true"><span className="ph-mark">LEE&nbsp;VU</span></div>}
            <img className="media-img" src="/media/lee-vu-stage.jpg" alt="" loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.classList.add('loaded'); hidePlate('candid'); }} />
            <span className="tone" aria-hidden="true"></span>
          </div>
          <div className="reel-veil" aria-hidden="true"></div>
          <div className="reel-content">
            <div className="reel-copy">
              <p className="eyebrow">{t.reelEyebrow}</p>
              <h2 className="reel-title" id="reel-title">{t.reelTitle}</h2>
              <p className="reel-meta">{t.reelMeta}</p>
            </div>
            <button className="play" type="button" onClick={openFilm} aria-label={t.modalLabel}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"></path></svg>
            </button>
            <ul className="reel-tags">{[t.g1, t.g2, t.g3, t.g4].map(g => <li key={g}>{g}</li>)}</ul>
            <div className="reel-html-panel">
              <iframe className="reel-html-frame" src={REEL_HTML} title="MC Lee Vu — The Reel" loading="lazy"></iframe>
            </div>
            <div className="reel-strip" aria-hidden="true">
              <img src="/media/lee-vu-portrait-navy.jpg" alt="" loading="lazy" decoding="async" />
              <img src="/media/lee-vu-portrait-blue.jpg" alt="" loading="lazy" decoding="async" />
              <img src="/media/lee-vu-stage.jpg" alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>
      <section className="purpose" id="purpose" aria-labelledby="purpose-title">
        <div className="purpose-grid">
          <div className="purpose-copy">
            <p className="eyebrow eyebrow--dark reveal">{t.pEyebrow}</p>
            <h2 className="purpose-title reveal" id="purpose-title" style={{ '--d': '.1s' }}>{t.pTitle}</h2>
            <span className="rule reveal-x" style={{ '--d': '.2s' }} aria-hidden="true"></span>
            <p className="purpose-body reveal" style={{ '--d': '.28s' }}>{t.pBody}</p>
            <a className="text-link reveal" style={{ '--d': '.38s' }} href={HEALTH_LINK} target="_blank" rel="noreferrer">
              <span>{t.pLink}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10"></path></svg>
            </a>
          </div>
          <div className="collage">
            <figure className="collage-main">
              <div className="clip reveal-clip" style={{ '--d': '.15s' }}>
                <div className={"ph ph--portrait" + (platesHidden.portrait ? " ph-done" : "")} aria-hidden="true"></div>
                <img className="media-img" src="/media/lee-vu-portrait-blue.jpg" alt={t.portraitAlt} loading="lazy" decoding="async" onLoad={(e) => { e.currentTarget.classList.add('loaded'); hidePlate('portrait'); }} />
                <span className="tone" aria-hidden="true"></span>
              </div>
              <span className="frame" style={{ '--d': '.5s' }} aria-hidden="true"></span>
            </figure>
            <aside className="quote-card reveal" style={{ '--d': '.3s' }}>
              <p className="quote-text">{t.quote}</p>
              <span className="quote-sig">Lee Vu</span>
              <span className="quote-role">MC · Sydney</span>
            </aside>
            <figure className="collage-small reveal-clip" style={{ '--d': '.42s' }}>
              <div className="skyline-card">
                <svg viewBox="0 0 420 220" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="goldLine" x1="0" y1="220" x2="420" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9a7a3f"></stop><stop offset=".5" stopColor="#e7d2a2"></stop><stop offset="1" stopColor="#c8a45f"></stop>
                    </linearGradient>
                  </defs>
                  <g stroke="url(#goldLine)" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M20 150 C26 112 44 88 74 76 C52 100 40 126 36 150"></path>
                    <path d="M52 150 C60 104 82 76 116 64 C90 92 76 122 72 150"></path>
                    <path d="M88 150 C98 96 124 64 162 52 C132 84 116 120 112 150"></path>
                    <path d="M205 150 Q300 18 395 150"></path>
                    <path d="M198 118 H412"></path>
                    <path d="M205 150 V104 M395 150 V104"></path>
                    <path d="M199 104 H211 M389 104 H401"></path>
                    <path d="M233.5 116.3 V118 M262 94.6 V118 M300 84 V118 M338 94.6 V118 M366.5 116.3 V118" strokeWidth="1"></path>
                  </g>
                  <g stroke="url(#goldLine)" strokeWidth="1" opacity=".35">
                    <path d="M14 150 H410"></path>
                    <path d="M40 162 H120 M230 164 H360 M70 172 H150 M260 174 H340" strokeDasharray="7 5" opacity=".55"></path>
                  </g>
                  <g fill="#e7d2a2">
                    <circle cx="60" cy="38" r="1.1" opacity=".55"></circle><circle cx="150" cy="24" r=".9" opacity=".45"></circle>
                    <circle cx="242" cy="42" r="1" opacity=".5"></circle><circle cx="352" cy="28" r="1.2" opacity=".6"></circle>
                    <circle cx="392" cy="58" r=".8" opacity=".4"></circle><circle cx="108" cy="50" r=".8" opacity=".4"></circle>
                  </g>
                </svg>
                <figcaption className="script-caption gold-text">{t.cap}</figcaption>
              </div>
            </figure>
          </div>
        </div>
      </section>
      <section className="enquire" id="enquire" aria-labelledby="enquire-title">
        <div className="enquire-head">
          <p className="eyebrow eyebrow--center reveal">{t.enquireEyebrow}</p>
          <h2 className="enquire-title reveal" id="enquire-title" style={{ '--d': '.08s' }}>{t.availabilityTitle}</h2>
          <p className="enquire-sub reveal" style={{ '--d': '.16s' }}>{t.contactBody}</p>
        </div>
        <div className="reveal" style={{ '--d': '.2s' }}>
          <Availability t={t} />
        </div>
        <div className="enquire-contact">
          <a className="contact-tile" href="tel:+61401676766"><small>{t.phoneLabel}</small><strong>0401 676 766</strong></a>
          <a className="contact-tile" href="mailto:mcleevu@gmail.com"><small>{t.emailLabel}</small><strong>mcleevu@gmail.com</strong></a>
        </div>
        <div className="enquire-faq">
          <p className="enquire-faq-heading">{t.faqHeading}</p>
          {t.faqs.map(([q, a], index) => <details className="faq-item" key={q}>
            <summary><span>{q}</span><b aria-hidden="true">+</b></summary>
            <p>{a}</p>
          </details>)}
        </div>
      </section>
    </main>
    <footer className="footer">
      <p className="eyebrow eyebrow--center reveal">{t.footEyebrow}</p>
      <p className="foot-script gold-text reveal" style={{ '--d': '.1s' }}>{t.footName}</p>
      <p className="foot-sub reveal" style={{ '--d': '.18s' }}>{t.footSub}</p>
      <a className="btn btn-gold reveal" style={{ '--d': '.26s' }} href="mailto:mcleevu@gmail.com">
        <span>{t.footCta}</span><IcArrow />
      </a>
      <div className="foot-bottom">
        <span>{t.footRights}</span>
        <span>{t.footWords}</span>
        <a className="to-top" href="#top"><span>{t.footTop}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>
        </a>
      </div>
    </footer>
    <FilmModal open={filmOpen} onClose={closeFilm} label={t.modalLabel} sub={t.modalSub} soon={t.modalSoon} />
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
