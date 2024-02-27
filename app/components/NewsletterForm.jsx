import { useFetcher, useLoaderData } from '@remix-run/react';
export function Newsletter() {
  const { Form, ...fetcher } = useFetcher();
  const { data } = fetcher;
  const subscribeSuccess = data?.subscriber;
  const subscribeError = data?.error;

  return (
    <div>
      <h3>Newsletter</h3>
      <p>Subscribe to our newsletter to get the latest updates.</p>
      <br />

      {subscribeSuccess ? (
        <p style={{ color: 'green' }}>
          You have successfully subscribed to our newsletter!
        </p>
      ) : (
        <Form method="post" action="/newsletter">
          <input
            placeholder="Your email"
            type="email"
            name="email"
            id="email"
          />
          <button type="submit">Subscribe</button>
        </Form>
      )}
      {subscribeError && <p style={{ color: 'red' }}>{data.error.message}</p>}
    </div>
  );
}