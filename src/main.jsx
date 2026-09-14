import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './contact.css';

const faqs = [
  ['What does an MC actually do?', 'I help your celebration move naturally—from welcoming guests through the final toast—while keeping everyone informed, comfortable and present.'],
  ['How do we get started?', 'Send through your date and a few details about your celebration. We’ll arrange a relaxed chat to see if we are a good fit.'],
  ['Can you help with the run sheet?', 'Yes. We can shape a clear, personal flow for the day together, including key moments and introductions.'],
  ['Do you travel?', 'Let me know where you are celebrating in your enquiry and I’ll confirm availability.']
];

function App() {
  const [openFaq, setOpenFaq] = useState(null);
  const goToEnquire = () => document.querySelector('#enquire').scrollIntoView({ behavior: 'smooth' });
  const sendEnquiry = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Wedding MC enquiry from ${data.get('name')}`);
    const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`);
    window.location.href = `mailto:mcleevu@gmail.com?subject=${subject}&body=${body}`;
  };
  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Lee Vu Wedding MC home"><span>Lee Vu</span><small>Wedding MC</small></a>
      <nav aria-label="Primary navigation"><a href="#approach">Approach</a><a href="#video">Video</a><a href="#enquire">Enquire</a></nav>
      <button className="button button-small" onClick={goToEnquire}>Check availability</button>
    </header>
    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">A wedding that<br />feels like you.</h1>
          <p>Reliable, professional hosting in English<br className="desktop" /> and Vietnamese—since 2006.</p>
          <div className="hero-actions"><button className="button" onClick={goToEnquire}>Check availability</button><a className="button button-ghost" href="#video"><span aria-hidden="true">▶</span> Watch Lee in action</a></div>
        </div>
        <figure className="hero-photo"><img src="/media/lee-vu-portrait-navy.jpg" alt="Lee Vu in a navy suit" /></figure>
        <p className="hero-note">Good people.<br />Great days.</p>
      </section>
      <section className="approach" id="approach" aria-labelledby="approach-title">
        <div><h2 id="approach-title">A simple<br />way to begin.</h2><p className="bio">Creative, proactive and flexible—so your celebration stays personal and effortless.</p></div>
        <ol><li><span>01</span><h3>Meet</h3><p>Have a relaxed chat about your day.</p></li><li><span>02</span><h3>Shape</h3><p>We plan the flow together.</p></li><li><span>03</span><h3>Celebrate</h3><p>You enjoy it. I’ll take care of the rest.</p></li></ol>
      </section>
      <section className="video-section" id="video" aria-labelledby="video-title">
        <div><h2 id="video-title">See the feeling<br />for yourself.</h2><p>A glimpse into the energy, style and atmosphere I bring to the day.</p></div>
        <video controls preload="metadata" poster="/media/lee-vu-stage.jpg" aria-label="Lee Vu wedding MC reel"><source src="/media/lee-vu-reel.mp4" type="video/mp4" />Your browser does not support video playback.</video>
      </section>
      <section className="booking"><img src="/media/lee-vu-portrait-blue.jpg" alt="Lee Vu outdoors in a blue suit" /><div><p className="section-label">Booking enquiries</p><h2>From A$500</h2><p className="enquiry-only">Enquiry only</p><hr /><p>Let’s chat about your date and how I can help bring your celebration to life.</p></div><button className="button" onClick={goToEnquire}>Check availability</button></section>
      <section className="contact" id="enquire" aria-labelledby="contact-title">
        <div className="faqs"><h2>Frequently asked<br />questions.</h2>{faqs.map(([question, answer], index) => <article key={question}><button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<span>{openFaq === index ? '−' : '+'}</span></button>{openFaq === index && <p>{answer}</p>}</article>)}</div>
        <div className="enquiry"><h2 id="contact-title">Get in touch.</h2><p>Share a few details about your wedding and I’ll be in touch to check availability.</p><div className="direct-contact"><a href="mailto:mcleevu@gmail.com">mcleevu@gmail.com</a><a href="tel:+61401676766">0401 676 766</a></div><form onSubmit={sendEnquiry}><div className="form-row"><input required name="name" aria-label="Your name" placeholder="Your name" /><input required name="email" type="email" aria-label="Email address" placeholder="Email address" /></div><textarea required name="message" aria-label="Your message" placeholder="Tell me about your date, location and celebration" rows="5" /><button className="button" type="submit">Email Lee</button></form></div>
      </section>
    </main>
    <footer><a className="brand" href="#top"><span>Lee Vu</span><small>Wedding MC</small></a><p>A warmer kind of wedding.</p></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
