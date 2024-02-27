import {useFetcher } from '@remix-run/react';
export function ContactUs() {
  const {Form, ...fetcher} = useFetcher();
  const data = fetcher?.data;
  const formSubmitted = data?.form;
  const formError = data?.error;

  return (
    <div>
      <h3>Contact Us</h3>
      {formSubmitted ? (
        <div>
          <p>Thank you for your message. We will get back to you shortly.</p>
        </div>
      ) : (
        <ContactForm Form={Form} />
      )}
      {formError && (
        <div>
          <p>There was an error submitting your message. Please try again.</p>
          <p>{formError.message}</p>
        </div>
      )}
    </div>
  );
}

function ContactForm({Form}) {
  const yyyyMmDd = new Date().toISOString().split('T')[0];
  return (
    <Form action="/contact-form" method="post">
      <fieldset>
        <label htmlFor="name">Name</label>
        <input type="text" name="name" required />
      </fieldset>
      <fieldset>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" required />
      </fieldset>
      <fieldset>
        <label htmlFor="subject">Subject</label>
        <input type="subject" name="subject" required />
      </fieldset>
      <fieldset>
        <label htmlFor="message">Message</label>
      <textarea
        name="message"
        rows={12}
        required
      />
    </fieldset>
      <br />
      <button type="submit">Send</button>
    </Form>
  );
}
    