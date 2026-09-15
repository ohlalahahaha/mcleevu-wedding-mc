import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const COPY = {
  en: {
    nav: ['About','Video','Contact'], book: 'Check date',
    heroTitle: 'Bilingual wedding MC in Sydney.',
    heroBody: 'Since 2006, Lee Vu has hosted weddings in English and Vietnamese, guiding the run sheet, the room and the moments that matter.',
    trust: ['English + Vietnamese','Since 2006','Sydney','One wedding per date'],
    aboutTitle: 'More than an MC.',
    aboutBody: 'Before the reception, Lee works through the run sheet, names and family details. On the night, he guides the program in English, Vietnamese or both, and adjusts calmly when timing changes.',
    aboutBody2: 'Away from weddings, Lee works in healthcare as an optometrist and audiologist and is associated with Acoustic Hearing Care. He has also supported Sydney’s Vietnamese community through arts, charity and community events.',
    healthLink: 'Acoustic Hearing Care',
    sydneyTitle: 'Sydney weddings, hosted in English and Vietnamese.',
    sydneyBody: 'Lee switches between English and Vietnamese through the reception so both sides of the family can follow the program and the key moments.',
    approachTitle: 'What Lee handles',
    approachItems: [['Before the reception','Run sheet, names, family details and the moments you want introduced.'],['During the reception','Guide the program, introduce key moments and host in English, Vietnamese or both.'],['When timing changes','Adjust the order and keep both families informed so you can stay with your guests.']],
    videoTitle: 'See Lee on the microphone', videoBody: 'A short reel of Lee speaking as an MC.',
    total: 'A$1,000 total', coverage: 'From 6:00 PM until the reception concludes.', deposit: 'A$500 booking deposit', balance: 'A$500 remaining balance',
    availabilityTitle: 'Check your wedding date', availabilityBody: 'Choose your date. If Lee is available, you can continue with your details.',
    selectDate: 'Wedding date', checkDate: 'Check date', checking: 'Checking…', available: 'Lee is available on this date.', availableBody: 'Continue with your details to secure the date with the A$500 deposit.', held: 'This date is temporarily held.', unavailable: 'Lee is already booked on this date.', unavailableBody: 'Choose another date or contact Lee directly.',
    serviceUnavailable: 'Online date checking is unavailable.', serviceUnavailableBody: 'Contact Lee directly while the booking connection is unavailable.', checkingError: 'The date could not be checked. Try again or contact Lee directly.',
    detailsTitle: 'Wedding details', yourName: 'Your name', partnerName: 'Partner name', email: 'Email', phone: 'Phone', venue: 'Venue name', venueAddress: 'Venue address', language: 'Hosting language', languageOptions: ['English + Vietnamese','English','Vietnamese'], notes: 'Notes for Lee',
    summaryTitle: 'Booking summary', dueToday: 'Due today', remaining: 'Remaining', pay: 'Pay A$500 deposit', paying: 'Opening checkout…', stripeNote: 'Your date is confirmed after the deposit payment succeeds.', formError: 'Complete the required details and try again.', checkoutError: 'Checkout could not be opened. Try again or contact Lee directly.',
    returnSuccess: 'Your wedding date is confirmed.', returnSuccessBody: 'Your A$500 deposit has been received. Lee will contact you about the next steps.', returnPending: 'Payment is being confirmed.', returnPendingBody: 'Please wait while the booking confirmation completes.', returnCancelled: 'Checkout was cancelled.', returnCancelledBody: 'Your date is not confirmed. Recheck the date before trying again.', resume: 'Recheck date', phoneLabel: 'Phone', emailLabel: 'Email',
    contactTitle: 'Speak with Lee', contactBody: 'Tell Lee your date, venue and what matters to both families.', faqTitle: 'Before you book',
    faqs: [['Can Lee host in English and Vietnamese?','Yes. Lee can host in English, Vietnamese or combine both during the reception.'],['What hours are included?','Wedding reception hosting runs from 6:00 PM until the reception concludes.'],['How is the date secured?','After the date is confirmed available, the booking is secured when the A$500 deposit payment succeeds.']],
    pageTitle: 'Vietnamese & English Wedding MC Sydney | MC Lee Vu', pageDescription: 'MC Lee Vu is a Sydney wedding MC hosting in English and Vietnamese since 2006. Check your wedding date online.'
  },
  vi: {
    nav: ['Giới thiệu','Video','Liên hệ'], book: 'Kiểm tra ngày',
    heroTitle: 'MC đám cưới song ngữ tại Sydney.',
    heroBody: 'Từ năm 2006, Lê Vũ dẫn tiệc cưới bằng tiếng Anh và tiếng Việt, giữ nhịp chương trình và những khoảnh khắc quan trọng của hai gia đình.',
    trust: ['Anh + Việt','Từ năm 2006','Sydney','Mỗi ngày một tiệc'],
    aboutTitle: 'Hơn cả một MC.',
    aboutBody: 'Trước buổi tiệc, Lê Vũ chuẩn bị kỹ lịch trình, tên gọi và thông tin gia đình. Trong tiệc, anh dẫn bằng tiếng Anh, tiếng Việt hoặc cả hai, đồng thời điều chỉnh nhẹ nhàng khi thời gian thay đổi.',
    aboutBody2: 'Ngoài công việc MC, Lê Vũ làm việc trong lĩnh vực y tế với chuyên môn đo thị lực và thính học, gắn bó với Acoustic Hearing Care. Anh cũng nhiều năm tham gia các hoạt động văn nghệ, từ thiện và cộng đồng người Việt tại Sydney.',
    healthLink: 'Acoustic Hearing Care',
    sydneyTitle: 'Tiệc cưới tại Sydney, dẫn bằng tiếng Anh và tiếng Việt.',
    sydneyBody: 'Trong buổi tiệc, Lê Vũ chuyển đổi giữa tiếng Anh và tiếng Việt để hai bên gia đình đều theo dõi được chương trình và các phần quan trọng.',
    approachTitle: 'Lê Vũ phụ trách những gì',
    approachItems: [['Trước buổi tiệc','Lịch trình, tên gọi, thông tin gia đình và các phần cần giới thiệu.'],['Trong buổi tiệc','Dẫn chương trình, giới thiệu các phần quan trọng bằng tiếng Anh, tiếng Việt hoặc cả hai.'],['Khi lịch trình thay đổi','Điều chỉnh thứ tự và thông báo rõ ràng để hai gia đình cùng theo dõi.']],
    videoTitle: 'Xem Lê Vũ dẫn chương trình', videoBody: 'Một đoạn video ngắn khi Lê Vũ cầm mic dẫn chương trình.',
    total: 'Tổng phí A$1,000', coverage: 'Từ 6:00 tối đến khi tiệc kết thúc.', deposit: 'Đặt cọc A$500', balance: 'Còn lại A$500',
    availabilityTitle: 'Kiểm tra ngày cưới', availabilityBody: 'Chọn ngày cưới. Nếu Lê Vũ còn lịch, bạn có thể tiếp tục điền thông tin.',
    selectDate: 'Ngày cưới', checkDate: 'Kiểm tra ngày', checking: 'Đang kiểm tra…', available: 'Lê Vũ còn lịch ngày này.', availableBody: 'Tiếp tục điền thông tin để giữ ngày bằng khoản đặt cọc A$500.', held: 'Ngày này đang được tạm giữ.', unavailable: 'Lê Vũ đã có lịch ngày này.', unavailableBody: 'Chọn ngày khác hoặc liên hệ trực tiếp với Lê Vũ.',
    serviceUnavailable: 'Hiện chưa thể kiểm tra ngày trực tuyến.', serviceUnavailableBody: 'Vui lòng liên hệ trực tiếp với Lê Vũ trong lúc hệ thống đặt lịch chưa kết nối.', checkingError: 'Chưa thể kiểm tra ngày. Vui lòng thử lại hoặc liên hệ trực tiếp.',
    detailsTitle: 'Thông tin tiệc cưới', yourName: 'Tên của bạn', partnerName: 'Tên người bạn đời', email: 'Email', phone: 'Điện thoại', venue: 'Tên địa điểm', venueAddress: 'Địa chỉ địa điểm', language: 'Ngôn ngữ dẫn', languageOptions: ['Anh + Việt','Tiếng Anh','Tiếng Việt'], notes: 'Ghi chú cho Lê Vũ',
    summaryTitle: 'Thông tin đặt lịch', dueToday: 'Thanh toán hôm nay', remaining: 'Còn lại', pay: 'Đặt cọc A$500', paying: 'Đang mở thanh toán…', stripeNote: 'Ngày cưới được xác nhận sau khi thanh toán đặt cọc thành công.', formError: 'Vui lòng điền các thông tin bắt buộc.', checkoutError: 'Chưa thể mở trang thanh toán. Vui lòng thử lại hoặc liên hệ Lê Vũ.',
    returnSuccess: 'Ngày cưới đã được xác nhận.', returnSuccessBody: 'Khoản đặt cọc A$500 đã được nhận. Lê Vũ sẽ liên hệ về các bước tiếp theo.', returnPending: 'Đang xác nhận thanh toán.', returnPendingBody: 'Vui lòng chờ trong khi hệ thống xác nhận đặt lịch.', returnCancelled: 'Đã huỷ thanh toán.', returnCancelledBody: 'Ngày cưới chưa được xác nhận. Hãy kiểm tra lại ngày trước khi thử lại.', resume: 'Kiểm tra lại ngày', phoneLabel: 'Điện thoại', emailLabel: 'Email',
    contactTitle: 'Trao đổi với Lê Vũ', contactBody: 'Chia sẻ ngày cưới, địa điểm và những điều quan trọng với hai gia đình.', faqTitle: 'Trước khi đặt lịch',
    faqs: [['Lê Vũ có thể dẫn bằng cả tiếng Anh và tiếng Việt không?','Có. Lê Vũ có thể dẫn bằng tiếng Anh, tiếng Việt hoặc kết hợp cả hai trong buổi tiệc.'],['Thời gian dẫn chương trình là bao lâu?','Phần dẫn tiệc cưới bắt đầu từ 6:00 tối và kéo dài đến khi tiệc kết thúc.'],['Khi nào ngày cưới được giữ?','Sau khi ngày được xác nhận còn trống, lịch được giữ khi khoản đặt cọc A$500 thanh toán thành công.']],
    pageTitle: 'MC Đám Cưới Song Ngữ Sydney | MC Lê Vũ', pageDescription: 'MC Lê Vũ dẫn tiệc cưới bằng tiếng Anh và tiếng Việt tại Sydney từ năm 2006. Kiểm tra ngày cưới trực tuyến.'
  }
};

function Availability({t}){
  const [date,setDate]=useState(''); const [status,setStatus]=useState('idle'); const [message,setMessage]=useState(''); const [detailsOpen,setDetailsOpen]=useState(false); const [submitting,setSubmitting]=useState(false); const errorRef=useRef(null);
  const minDate=useMemo(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),[]);
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const booking=params.get('booking');const id=params.get('booking_id');if(!['success','cancelled'].includes(booking))return;let active=true;let timer;const check=async(attempt=0)=>{if(booking==='cancelled'){if(id){try{const r=await fetch(`/api/booking-status?id=${encodeURIComponent(id)}`,{headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(active&&r.ok&&d.event_date)setDate(d.event_date)}catch{/* cancelled state remains truthful without booking details */}}if(active)setStatus('return-cancelled');return}if(!id){if(active)setStatus('return-pending');return}try{const r=await fetch(`/api/booking-status?id=${encodeURIComponent(id)}`,{headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!active)return;if(r.ok&&d.status==='confirmed'&&d.deposit_status==='paid'){setStatus('return-confirmed');return}setStatus('return-pending')}catch{if(active)setStatus('return-pending')}if(active&&attempt<9)timer=setTimeout(()=>check(attempt+1),2000)};check();return()=>{active=false;clearTimeout(timer)}},[]);
  useEffect(()=>{if(message)errorRef.current?.focus()},[message]);
  const checkDate=async()=>{if(!date)return;setStatus('checking');setDetailsOpen(false);setMessage('');try{const r=await fetch(`/api/availability?date=${encodeURIComponent(date)}`,{headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok||!['available','held','unavailable'].includes(d.status))throw new Error();setStatus(d.status)}catch{setStatus('service-unavailable')}};
  const submitBooking=async(e)=>{e.preventDefault();if(!e.currentTarget.reportValidity()){setMessage(t.formError);return}setSubmitting(true);setMessage('');const payload=Object.fromEntries(new FormData(e.currentTarget).entries());payload.eventDate=date;try{const r=await fetch('/api/create-checkout',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok||!d.url)throw new Error();window.location.assign(d.url)}catch{setMessage(t.checkoutError)}finally{setSubmitting(false)}};
  const returnState=status.startsWith('return-')&&<div className={`return-state ${status}`} role="status"><strong>{status==='return-confirmed'?t.returnSuccess:status==='return-pending'?t.returnPending:t.returnCancelled}</strong><span>{status==='return-confirmed'?t.returnSuccessBody:status==='return-pending'?t.returnPendingBody:t.returnCancelledBody}</span>{status==='return-cancelled'&&<button className="text-button" type="button" onClick={()=>{setStatus('idle');setDetailsOpen(false);requestAnimationFrame(()=>document.querySelector('#wedding-date')?.focus())}}>{t.resume}</button>}</div>;
  return <section className="availability-section" id="availability" aria-labelledby="availability-title"><div className="availability-intro"><h2 id="availability-title">{t.availabilityTitle}</h2><p>{t.availabilityBody}</p></div><div className="availability-card">{returnState}<div className="date-checker"><label htmlFor="wedding-date">{t.selectDate}</label><div className="date-row"><input id="wedding-date" type="date" min={minDate} value={date} onChange={e=>{setDate(e.target.value);setStatus('idle');setDetailsOpen(false)}}/><button className="button" type="button" onClick={checkDate} disabled={!date||status==='checking'}>{status==='checking'?t.checking:t.checkDate}</button></div></div>{status==='available'&&<div className="availability-result success" role="status"><strong>{t.available}</strong><span>{t.availableBody}</span><button className="text-button" type="button" onClick={()=>setDetailsOpen(true)}>{t.book}</button></div>}{['held','unavailable'].includes(status)&&<div className="availability-result neutral" role="status"><strong>{status==='held'?t.held:t.unavailable}</strong><span>{t.unavailableBody}</span></div>}{status==='service-unavailable'&&<div className="availability-result neutral" role="status"><strong>{t.serviceUnavailable}</strong><span>{t.serviceUnavailableBody}</span><a className="text-button" href="mailto:mcleevu@gmail.com">mcleevu@gmail.com</a></div>}{detailsOpen&&status==='available'&&<form className="booking-form" onSubmit={submitBooking} noValidate><div className="form-heading"><h3>{t.detailsTitle}</h3></div><div className="form-grid"><label><span>{t.yourName}</span><input name="customerName" autoComplete="name" required maxLength="100"/></label><label><span>{t.partnerName}</span><input name="partnerName" autoComplete="name" required maxLength="100"/></label><label><span>{t.email}</span><input name="email" type="email" autoComplete="email" required maxLength="160"/></label><label><span>{t.phone}</span><input name="phone" type="tel" autoComplete="tel" required maxLength="40"/></label><label><span>{t.venue}</span><input name="venueName" maxLength="160"/></label><label><span>{t.venueAddress}</span><input name="venueAddress" autoComplete="street-address" maxLength="240"/></label><label className="full"><span>{t.language}</span><select name="languagePreference" defaultValue="bilingual"><option value="bilingual">{t.languageOptions[0]}</option><option value="english">{t.languageOptions[1]}</option><option value="vietnamese">{t.languageOptions[2]}</option></select></label><label className="full"><span>{t.notes}</span><textarea name="notes" rows="4" maxLength="1200"/></label></div><div className="checkout-summary"><div><p className="eyebrow">{t.summaryTitle}</p><strong>{date}</strong><span>{t.coverage}</span></div><dl><div><dt>{t.total}</dt><dd>A$1,000</dd></div><div><dt>{t.dueToday}</dt><dd>A$500</dd></div><div><dt>{t.remaining}</dt><dd>A$500</dd></div></dl><button className="button button-wide" type="submit" disabled={submitting}>{submitting?t.paying:t.pay}</button><p className="stripe-note">{t.stripeNote}</p></div></form>}{message&&<p className="form-error" role="alert" tabIndex="-1" ref={errorRef}>{message}</p>}</div></section>
}

function App(){
  const [lang,setLang]=useState('en');
  const [openFaq,setOpenFaq]=useState(null);
  const t=COPY[lang];
  const scrollToAvailability=()=>document.querySelector('#availability')?.scrollIntoView({behavior:'smooth',block:'start'});
  useEffect(()=>{document.documentElement.lang=lang==='vi'?'vi-AU':'en-AU';document.title=t.pageTitle;document.querySelector('meta[name="description"]')?.setAttribute('content',t.pageDescription)},[lang,t]);
  const realPhotoAlt=lang==='vi'?'MC Lê Vũ':'MC Lee Vu';
  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="MC Lee Vu Sydney home"><span>MC Lee Vu</span><small>{lang==='vi'?'MC đám cưới song ngữ Sydney':'Bilingual Wedding MC Sydney'}</small></a>
      <nav className="desktop-nav" aria-label={lang==='vi'?'Điều hướng chính':'Primary navigation'}>
        <a href="#about">{t.nav[0]}</a><a href="#video">{t.nav[1]}</a><a href="#contact">{t.nav[2]}</a>
      </nav>
      <div className="header-actions"><button className="lang-toggle" type="button" onClick={()=>setLang(lang==='en'?'vi':'en')} aria-label={lang==='en'?'Chuyển sang tiếng Việt':'Switch to English'}>{lang==='en'?'EN | VI':'VI | EN'}</button><button className="button button-gold button-small" type="button" onClick={scrollToAvailability}>{t.book}</button></div>
    </header>
    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-atmosphere" aria-hidden="true"></div>
        <div className="hero-inner">
          <div className="hero-copy"><h1 id="hero-title">{t.heroTitle}</h1><p className="hero-lead">{t.heroBody}</p><div className="hero-actions"><button className="button button-gold" type="button" onClick={scrollToAvailability}>{t.book}</button><a className="video-link" href="#video"><span className="play-dot" aria-hidden="true">▶</span>{lang==='en'?'Watch Lee':'Xem Lê Vũ'}</a></div></div>
          <div className="hero-portrait"><div className="hero-light" aria-hidden="true"></div><img src="/media/lee-vu-cutout.webp" alt={realPhotoAlt} fetchPriority="high"/><div className="hero-flower" aria-hidden="true"></div></div>
        </div>
      </section>
      <section className="trust-strip" aria-label={lang==='vi'?'Thông tin về Lê Vũ':'Lee Vu facts'}>{t.trust.map(item=><strong key={item}>{item}</strong>)}</section>
      <div className="story-band">
        <section className="about" id="about" aria-labelledby="about-title"><figure className="about-photo"><img src="/media/lee-vu-portrait-blue.jpg" alt={realPhotoAlt} loading="lazy"/></figure><div className="section-copy"><h2 id="about-title">{t.aboutTitle}</h2><p>{t.aboutBody}</p><p className="human-note">{t.aboutBody2} <a className="quiet-link" href="https://business.fairfieldcity.nsw.gov.au/Business-Directory/Acoustic-Hearing-Care" target="_blank" rel="noreferrer">{t.healthLink}</a>.</p></div></section>
        <section className="sydney-moment" aria-labelledby="sydney-title"><div className="sydney-image" aria-hidden="true"></div><div className="sydney-overlay" aria-hidden="true"></div><div className="sydney-copy"><p className="sydney-label">{lang==='vi'?'Sydney · Anh + Việt':'Sydney · English + Vietnamese'}</p><h2 id="sydney-title">{t.sydneyTitle}</h2><p>{t.sydneyBody}</p></div></section>
      </div>
      <section className="approach section-shell" aria-labelledby="approach-title"><div className="approach-intro"><h2 id="approach-title">{t.approachTitle}</h2></div><ol>{t.approachItems.map(([title,body],index)=><li key={title}><span className="step-number">{index+1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol></section>
      <section className="media-section" id="video" aria-labelledby="video-title"><div className="media-inner"><div className="video-column"><div className="media-copy"><h2 id="video-title">{t.videoTitle}</h2><p>{t.videoBody}</p></div><div className="video-frame"><video controls playsInline preload="metadata" poster="/media/lee-vu-stage.jpg" aria-label={lang==='vi'?'Video MC Lê Vũ':'MC Lee Vu video'}><source src="/media/lee-vu-reel.mp4" type="video/mp4"/></video></div></div><Availability t={t}/></div></section>
      <div className="closing-band">
        <section className="contact-section" id="contact" aria-labelledby="contact-title"><div className="contact-inner"><div><h2 id="contact-title">{t.contactTitle}</h2><p>{t.contactBody}</p></div><div className="contact-links"><a href="tel:+61401676766"><small>{t.phoneLabel}</small><strong>0401 676 766</strong></a><a href="mailto:mcleevu@gmail.com"><small>{t.emailLabel}</small><strong>mcleevu@gmail.com</strong></a></div></div></section>
        <section className="faq-section" aria-labelledby="faq-title"><h2 id="faq-title">{t.faqTitle}</h2><div className="faq-list">{t.faqs.map(([q,a],index)=><article key={q}><button type="button" aria-expanded={openFaq===index} aria-controls={`faq-answer-${index}`} onClick={()=>setOpenFaq(openFaq===index?null:index)}><span>{q}</span><b aria-hidden="true">{openFaq===index?'−':'+'}</b></button>{openFaq===index?<p id={`faq-answer-${index}`}>{a}</p>:null}</article>)}</div></section>
      </div>
    </main>
    <footer><div className="footer-inner"><div className="brand footer-brand"><span>MC Lee Vu</span><small>{lang==='vi'?'Sydney · Anh + Việt · từ 2006':'Sydney · English + Vietnamese · since 2006'}</small></div><button className="button button-gold" type="button" onClick={scrollToAvailability}>{t.book}</button><p>© 2026 MC Lee Vu</p></div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
