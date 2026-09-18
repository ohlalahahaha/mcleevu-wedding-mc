import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { buildEnquiryMailto } from './enquiry.js';
import './styles.css';

const COPY = {
  en: {
    nav: ['About','Video','Contact'], enquire: 'Enquire with Lee',
    heroEyebrow: 'YOUR STORY · BEAUTIFULLY SPOKEN.',
    heroTitle: 'Bilingual wedding MC in Sydney.',
    heroBody: 'Since 2006, Lee Vu has hosted weddings in English and Vietnamese, guiding the run sheet, the room and the moments that matter.',
    trust: ['English + Vietnamese','Since 2006','Sydney','One wedding per date'],
    aboutTitle: 'More than an MC.',
    aboutBody: 'Before the reception, Lee works through the run sheet, names and family details. On the night, he guides the program in English, Vietnamese or both, and adjusts calmly when timing changes.',
    aboutBody2: 'Away from weddings, Lee works in healthcare as an optometrist and audiologist and is associated with Acoustic Hearing Care. He has also supported Sydney’s Vietnamese community through arts, charity and community events.',
    healthLink: 'Acoustic Hearing Care',
    sydneyTitle: 'Sydney weddings, hosted in English and Vietnamese.',
    sydneyBody: 'Lee switches between English and Vietnamese through the reception so both sides of the family can follow the program and the key moments.',
    videoTitle: 'Watch Lee host', videoBody: 'A short reel of Lee speaking as an MC.',
    availabilityTitle: 'Enquire about your wedding date', availabilityBody: 'Email Lee with your date and plans, or call him directly. Choosing a date is optional — a chosen date is simply added to your email for Lee.',
    selectDate: 'Wedding date (optional)', emailLee: 'Email Lee', callLee: 'Call Lee', enquiryNote: 'Your email app opens with your message prepared — please press send there to reach Lee. An enquiry does not reserve your wedding date; Lee will reply personally to discuss next steps.',
    returnSuccess: 'Your wedding date is confirmed.', returnSuccessBody: 'Your A$500 deposit has been received. Lee will contact you about the next steps.', returnPending: 'Payment is being confirmed.', returnPendingBody: 'Please wait while the booking confirmation completes.', returnCancelled: 'Checkout was cancelled.', returnCancelledBody: 'Your date is not confirmed. Recheck the date before trying again.', resume: 'Recheck date', phoneLabel: 'Phone', emailLabel: 'Email',
    contactTitle: 'Speak with Lee', contactBody: 'Tell Lee your date, venue and what matters to both families.', faqTitle: 'Before you enquire',
    faqs: [['Can Lee host in English and Vietnamese?','Yes. Lee can host in English, Vietnamese or combine both during the reception.'],['What hours are included?','Wedding reception hosting runs from 6:00 PM until the reception concludes.'],['How do I enquire about my date?','Email or call Lee with your wedding date, venue and hosting language. Lee replies personally to discuss your day. An enquiry does not reserve the date — it simply starts the conversation.']],
    pageTitle: 'Vietnamese & English Wedding MC Sydney | MC Lee Vu', pageDescription: 'MC Lee Vu is a Sydney wedding MC hosting in English and Vietnamese since 2006. Enquire with Lee about your wedding date.'
  },
  vi: {
    nav: ['Giới thiệu','Video','Liên hệ'], enquire: 'Liên hệ Lê Vũ',
    heroTitle: 'MC đám cưới song ngữ tại Sydney.',
    heroBody: 'Từ năm 2006, Lê Vũ dẫn tiệc cưới bằng tiếng Anh và tiếng Việt, giữ nhịp chương trình và những khoảnh khắc quan trọng của hai gia đình.',
    trust: ['Anh + Việt','Từ năm 2006','Sydney','Mỗi ngày một tiệc'],
    aboutTitle: 'Hơn cả một MC.',
    aboutBody: 'Trước buổi tiệc, Lê Vũ chuẩn bị kỹ lịch trình, tên gọi và thông tin gia đình. Trong tiệc, anh dẫn bằng tiếng Anh, tiếng Việt hoặc cả hai, đồng thời điều chỉnh nhẹ nhàng khi thời gian thay đổi.',
    aboutBody2: 'Ngoài công việc MC, Lê Vũ làm việc trong lĩnh vực y tế với chuyên môn đo thị lực và thính học, gắn bó với Acoustic Hearing Care. Anh cũng nhiều năm tham gia các hoạt động văn nghệ, từ thiện và cộng đồng người Việt tại Sydney.',
    healthLink: 'Acoustic Hearing Care',
    sydneyTitle: 'Tiệc cưới tại Sydney, dẫn bằng tiếng Anh và tiếng Việt.',
    sydneyBody: 'Trong buổi tiệc, Lê Vũ chuyển đổi giữa tiếng Anh và tiếng Việt để hai bên gia đình đều theo dõi được chương trình và các phần quan trọng.',
    videoTitle: 'Xem Lê Vũ dẫn chương trình', videoBody: 'Một đoạn video ngắn khi Lê Vũ cầm mic dẫn chương trình.',
    availabilityTitle: 'Hỏi ngày cưới với Lê Vũ', availabilityBody: 'Gửi email cho Lê Vũ với ngày cưới và kế hoạch của hai bạn, hoặc gọi điện trực tiếp. Chọn ngày là không bắt buộc — ngày đã chọn chỉ được thêm vào email để Lê Vũ biết.',
    selectDate: 'Ngày cưới (không bắt buộc)', emailLee: 'Gửi email cho Lê Vũ', callLee: 'Gọi cho Lê Vũ', enquiryNote: 'Ứng dụng email của bạn sẽ mở với thư đã soạn sẵn — bạn cần nhấn gửi trong ứng dụng để liên hệ với Lê Vũ. Việc gửi email không giữ ngày cưới; Lê Vũ sẽ trực tiếp trả lời để trao đổi các bước tiếp theo.',
    returnSuccess: 'Ngày cưới đã được xác nhận.', returnSuccessBody: 'Khoản đặt cọc A$500 đã được nhận. Lê Vũ sẽ liên hệ về các bước tiếp theo.', returnPending: 'Đang xác nhận thanh toán.', returnPendingBody: 'Vui lòng chờ trong khi hệ thống xác nhận đặt lịch.', returnCancelled: 'Đã huỷ thanh toán.', returnCancelledBody: 'Ngày cưới chưa được xác nhận. Hãy kiểm tra lại ngày trước khi thử lại.', resume: 'Kiểm tra lại ngày', phoneLabel: 'Điện thoại', emailLabel: 'Email',
    contactTitle: 'Trao đổi với Lê Vũ', contactBody: 'Chia sẻ ngày cưới, địa điểm và những điều quan trọng với hai gia đình.', faqTitle: 'Trước khi liên hệ',
    faqs: [['Lê Vũ có thể dẫn bằng cả tiếng Anh và tiếng Việt không?','Có. Lê Vũ có thể dẫn bằng tiếng Anh, tiếng Việt hoặc kết hợp cả hai trong buổi tiệc.'],['Thời gian dẫn chương trình là bao lâu?','Phần dẫn tiệc cưới bắt đầu từ 6:00 tối và kéo dài đến khi tiệc kết thúc.'],['Làm sao để hỏi ngày cưới với Lê Vũ?','Gửi email hoặc gọi điện cho Lê Vũ với ngày cưới, địa điểm và ngôn ngữ dẫn. Lê Vũ sẽ trực tiếp trả lời để trao đổi. Việc liên hệ không giữ ngày cưới — đó là bước bắt đầu trao đổi.']],
    pageTitle: 'MC Đám Cưới Song Ngữ Sydney | MC Lê Vũ', pageDescription: 'MC Lê Vũ dẫn tiệc cưới bằng tiếng Anh và tiếng Việt tại Sydney từ năm 2006. Hỏi lịch với Lê Vũ cho ngày cưới của bạn.'
  }
};

function Enquiry({t,lang}){
  const [date,setDate]=useState(''); const [status,setStatus]=useState('idle');
  const minDate=useMemo(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),[]);
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const booking=params.get('booking');const id=params.get('booking_id');if(!['success','cancelled'].includes(booking))return;let active=true;let timer;const check=async(attempt=0)=>{if(booking==='cancelled'){if(id){try{const r=await fetch(`/api/booking-status?id=${encodeURIComponent(id)}`,{headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(active&&r.ok&&d.event_date)setDate(d.event_date)}catch{/* cancelled state remains truthful without booking details */}}if(active)setStatus('return-cancelled');return}if(!id){if(active)setStatus('return-pending');return}try{const r=await fetch(`/api/booking-status?id=${encodeURIComponent(id)}`,{headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!active)return;if(r.ok&&d.status==='confirmed'&&d.deposit_status==='paid'){setStatus('return-confirmed');return}setStatus('return-pending')}catch{if(active)setStatus('return-pending')}if(active&&attempt<9)timer=setTimeout(()=>check(attempt+1),2000)};check();return()=>{active=false;clearTimeout(timer)}},[]);
  const mailtoHref=useMemo(()=>buildEnquiryMailto({date,lang}),[date,lang]);
  const returnState=status.startsWith('return-')&&<div className={`return-state ${status}`} role="status"><strong>{status==='return-confirmed'?t.returnSuccess:status==='return-pending'?t.returnPending:t.returnCancelled}</strong><span>{status==='return-confirmed'?t.returnSuccessBody:status==='return-pending'?t.returnPendingBody:t.returnCancelledBody}</span>{status==='return-cancelled'&&<button className="text-button" type="button" onClick={()=>{setStatus('idle');requestAnimationFrame(()=>document.querySelector('#wedding-date')?.focus())}}>{t.resume}</button>}</div>;
  return <section className="availability-section" id="availability" aria-labelledby="availability-title"><div className="availability-intro"><h2 id="availability-title">{t.availabilityTitle}</h2><p>{t.availabilityBody}</p></div><div className="availability-card">{returnState}<div className="date-checker"><label htmlFor="wedding-date">{t.selectDate}</label><input id="wedding-date" type="date" min={minDate} value={date} onChange={e=>{setDate(e.target.value);setStatus('idle')}}/></div><div className="enquiry-actions"><a className="button button-gold" href={mailtoHref}>{t.emailLee}</a><a className="button-quiet" href="tel:+61401676766">{t.callLee}</a></div><div className="enquiry-details"><span>{t.phoneLabel}</span><a href="tel:+61401676766">0401 676 766</a><span>{t.emailLabel}</span><a href="mailto:mcleevu@gmail.com">mcleevu@gmail.com</a></div><p className="enquiry-note">{t.enquiryNote}</p></div></section>
}

function App(){
  const [lang,setLang]=useState('en');
  const [openFaq,setOpenFaq]=useState(null);
  const t=COPY[lang];
  const scrollToEnquiry=()=>document.querySelector('#availability')?.scrollIntoView({behavior:'smooth',block:'start'});
  useEffect(()=>{document.documentElement.lang=lang==='vi'?'vi-AU':'en-AU';document.title=t.pageTitle;document.querySelector('meta[name="description"]')?.setAttribute('content',t.pageDescription)},[lang,t]);
  const realPhotoAlt=lang==='vi'?'MC Lê Vũ':'MC Lee Vu';
  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="MC Lee Vu Sydney home"><span>MC Lee Vu</span><small>{lang==='vi'?'MC đám cưới song ngữ Sydney':'Bilingual Wedding MC Sydney'}</small></a>
      <nav className="desktop-nav" aria-label={lang==='vi'?'Điều hướng chính':'Primary navigation'}>
        <a href="#about">{t.nav[0]}</a><a href="#video">{t.nav[1]}</a><a href="#contact">{t.nav[2]}</a>
      </nav>
      <div className="header-actions"><button className="lang-toggle" type="button" onClick={()=>setLang(lang==='en'?'vi':'en')} aria-label={lang==='en'?'Chuyển sang tiếng Việt':'Switch to English'}>{lang==='en'?'EN | VI':'VI | EN'}</button><button className="button button-gold button-small" type="button" onClick={scrollToEnquiry}>{t.enquire}</button></div>
    </header>
    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-atmosphere" aria-hidden="true"></div>
        <div className="hero-portrait"><img src="/media/lee-vu-stage.jpg" alt={realPhotoAlt+' holding a microphone'} fetchPriority="high"/></div>
        <div className="hero-inner">
          <div className="hero-copy"><h1 id="hero-title">{t.heroTitle}</h1><p className="hero-lead">{t.heroBody}</p><div className="hero-actions"><button className="button button-gold" type="button" onClick={scrollToEnquiry}>{t.enquire}</button><a className="video-link" href="#video"><span className="play-dot" aria-hidden="true">▶</span>{lang==='en'?'Watch Lee':'Xem Lê Vũ'}</a></div></div>
        </div>
      </section>
      <section className="trust-strip" aria-label={lang==='vi'?'Thông tin về Lê Vũ':'Lee Vu facts'}>{t.trust.map(item=><strong key={item}>{item}</strong>)}</section>
      <section className="story-band" id="about" aria-labelledby="about-title">
        <div className="about-panel"><div className="section-copy"><h2 id="about-title">{t.aboutTitle}</h2><p>{t.aboutBody}</p></div><figure className="about-photo"><img src="/media/lee-vu-portrait-navy.jpg" alt={realPhotoAlt} loading="lazy"/></figure></div>
        <aside className="identity-note"><span>{lang==='vi'?'Ngoài sân khấu':'Beyond the microphone'}</span><p>{lang==='vi'?'Ngoài sân khấu, Lê Vũ làm việc trong lĩnh vực đo thị lực và thính học, đồng thời nhiều năm đồng hành cùng cộng đồng người Việt tại Sydney.':'Away from the microphone, Lee works in optometry and audiology and has spent years supporting Sydney’s Vietnamese community.'}</p><a href="https://business.fairfieldcity.nsw.gov.au/Business-Directory/Acoustic-Hearing-Care" target="_blank" rel="noreferrer">{t.healthLink}</a></aside>
        <section className="sydney-moment" aria-labelledby="sydney-title"><div className="sydney-image" aria-hidden="true"></div><div className="sydney-overlay" aria-hidden="true"></div><div className="sydney-copy"><p className="sydney-label">{lang==='vi'?'Sydney · Anh + Việt':'Sydney · English + Vietnamese'}</p><h2 id="sydney-title">{t.sydneyTitle}</h2><p>{t.sydneyBody}</p></div></section>
      </section>
      <section className="media-section" id="video" aria-labelledby="video-title"><div className="media-inner"><div className="video-column"><div className="media-copy"><h2 id="video-title">{t.videoTitle}</h2><p>{t.videoBody}</p></div><div className="video-frame"><video controls playsInline preload="metadata" poster="/media/lee-vu-stage.jpg" aria-label={lang==='vi'?'Video MC Lê Vũ':'MC Lee Vu video'}><source src="/media/lee-vu-reel.mp4" type="video/mp4"/></video></div></div><Enquiry t={t} lang={lang}/></div></section>
      <div className="closing-band">
        <section className="contact-section" id="contact" aria-labelledby="contact-title"><div className="contact-inner"><div><h2 id="contact-title">{t.contactTitle}</h2><p>{t.contactBody}</p></div><div className="contact-links"><a href="tel:+61401676766"><small>{t.phoneLabel}</small><strong>0401 676 766</strong></a><a href="mailto:mcleevu@gmail.com"><small>{t.emailLabel}</small><strong>mcleevu@gmail.com</strong></a></div></div></section>
        <section className="faq-section" aria-labelledby="faq-title"><h2 id="faq-title">{t.faqTitle}</h2><div className="faq-list">{t.faqs.map(([q,a],index)=><article key={q}><button type="button" aria-expanded={openFaq===index} aria-controls={`faq-answer-${index}`} onClick={()=>setOpenFaq(openFaq===index?null:index)}><span>{q}</span><b aria-hidden="true">{openFaq===index?'−':'+'}</b></button>{openFaq===index?<p id={`faq-answer-${index}`}>{a}</p>:null}</article>)}</div></section>
      </div>
    </main>
    <footer><div className="footer-inner"><div className="brand footer-brand"><span>MC Lee Vu</span><small>{lang==='vi'?'Sydney · Anh + Việt · từ 2006':'Sydney · English + Vietnamese · since 2006'}</small></div><p>© 2026 MC Lee Vu</p></div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
