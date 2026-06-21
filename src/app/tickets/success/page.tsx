type SearchParams = Promise<{ session_id?: string }>;

export default async function TicketSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h1>Thanks — check your email for your ticket.</h1>
      {session_id ? (
        <p style={{ color: '#666', fontSize: 12 }}>
          Stripe session: <code>{session_id}</code>
        </p>
      ) : null}
      <p>
        <a href="/tickets-test">← Back</a>
      </p>
    </main>
  );
}
