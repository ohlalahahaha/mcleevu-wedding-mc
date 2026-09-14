import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './admin.css';

function Admin() {
  const [key, setKey] = useState('');
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('Enter the admin access key to load bookings.');
  const [blockedDate, setBlockedDate] = useState('');
  const headers = { 'x-admin-key': key, 'content-type': 'application/json' };

  const load = async () => {
    setMessage('Loading…');
    const response = await fetch('/api/admin-bookings', { headers: { 'x-admin-key': key } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || 'Unable to load bookings.');
    setBookings(data.bookings || []);
    setMessage(`${data.bookings?.length || 0} booking records loaded.`);
  };

  const blockDate = async (method) => {
    if (!blockedDate) return;
    const response = await fetch('/api/admin-block-date', { method, headers, body: JSON.stringify({ eventDate: blockedDate, reason: 'Manual admin block' }) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? (method === 'POST' ? `${blockedDate} blocked.` : `${blockedDate} unblocked.`) : (data.error || 'Unable to update date.'));
  };

  const createBalance = async (bookingId) => {
    const response = await fetch('/api/admin-balance-link', { method: 'POST', headers, body: JSON.stringify({ bookingId }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || 'Unable to create balance link.');
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  return <main className="admin-shell">
    <header><div><p>MC Lee Vu Sydney</p><h1>Bookings</h1></div><a href="/">View website</a></header>
    <section className="admin-auth"><label>Admin access key<input type="password" value={key} onChange={(e) => setKey(e.target.value)} /></label><button onClick={load} disabled={!key}>Load bookings</button><p>{message}</p></section>
    <section className="date-tools"><h2>Block a date</h2><div><input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} /><button onClick={() => blockDate('POST')} disabled={!key || !blockedDate}>Block</button><button className="quiet" onClick={() => blockDate('DELETE')} disabled={!key || !blockedDate}>Unblock</button></div></section>
    <section className="booking-list"><h2>Booking records</h2>{bookings.length === 0 ? <p className="empty">No records loaded.</p> : bookings.map((booking) => <article key={booking.id}><div><strong>{booking.event_date}</strong><span>{booking.customer_name} &amp; {booking.partner_name}</span><small>{booking.venue_name || 'Venue TBC'} · {booking.language_preference}</small></div><div className="status"><span>Deposit: {booking.deposit_status}</span><span>Balance: {booking.balance_status}</span><span>Calendar: {booking.calendar_sync_status || 'pending'}</span></div><div className="actions"><a href={`mailto:${booking.email}`}>Email couple</a>{booking.status === 'confirmed' && booking.balance_status !== 'paid' ? <button onClick={() => createBalance(booking.id)}>Create A$500 balance link</button> : null}</div></article>)}</section>
  </main>;
}

createRoot(document.getElementById('root')).render(<Admin />);
