import { client } from '@/sanity/lib/client';
import { BuyButton } from './BuyButton';

export const dynamic = 'force-dynamic';

type Ticket = {
  _id: string;
  title: string;
  date: string | null;
  price: number;
  currency: string;
  totalSeats: number;
  seatsSold: number | null;
};

export default async function TicketsTestPage() {
  const ticket = await client.fetch<Ticket | null>(
    `*[_type == "ticket"] | order(_createdAt asc)[0]{
      _id, title, date, price, currency, totalSeats, seatsSold
    }`
  );

  if (!ticket) {
    return (
      <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
        <h1>No tickets yet</h1>
        <p>Create a Ticket document in <a href="/studio">/studio</a>.</p>
      </main>
    );
  }

  const sold = ticket.seatsSold ?? 0;
  const soldOut = sold >= ticket.totalSeats;
  const when = ticket.date ? new Date(ticket.date).toLocaleString() : 'Date TBD';

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h1 style={{ marginBottom: 8 }}>{ticket.title}</h1>
      <p style={{ color: '#666', marginTop: 0 }}>{when}</p>
      <p style={{ fontSize: 18 }}>
        {ticket.price} {ticket.currency.toUpperCase()}
      </p>
      <p>
        {sold} of {ticket.totalSeats} seats sold
      </p>
      {soldOut ? (
        <button disabled style={{ padding: '10px 16px', opacity: 0.5 }}>
          Sold out
        </button>
      ) : (
        <BuyButton ticketId={ticket._id} />
      )}
    </main>
  );
}
