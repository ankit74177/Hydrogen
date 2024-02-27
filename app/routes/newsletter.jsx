import { json, redirect } from '@shopify/remix-oxygen';

const Subscriber = {
  id: '',
  email: '',
  emailMarketingConsent: {
    consentUpdatedAt: '',
    marketingOptInLevel: '',
    marketingState: '',
  },
};

export async function action({ context, request }) {
  const formData = await request.formData();
  const email = formData.get('email') || '';
  try {
    const existing = await getCustomerConsent({
      email,
      context,
    });
    const alreadySubscribed =
      existing?.customer?.emailMarketingConsent?.marketingState ===
      'SUBSCRIBED';
    // already subscribed?
    if (alreadySubscribed) {
      return await returnSuccess({
        subscriber: existing.customer,
        session: context.session,
      });
    }

    // create or update customer subscriber
    if (!existing.customer) {
      // create
      const created = await createSubscriber({
        email,
        context,
      });

      if (created.error) {
        return returnError({ error: created.error });
      }

      return await returnSuccess({
        subscriber: created.customer,
        session: context.session,
      });
    } else {
      // else, update existing
      const updated = await updateCustomerMarketingConsent({
        customerId: existing.customer.id,
        context,
      });

      if (updated.error) {
        return returnError({ error: updated.error });
      }

      return await returnSuccess({
        subscriber: updated.customer,
        session: context.session,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      return returnError({ error });
    }
    return returnError({ error: { message: JSON.stringify(error) } });
  }
}

export function loader() {
  return redirect('/');
}

/**
 * Returns a success response with a cookie for marketing consent
 * @param subscriber
 * @param session
 */
async function returnSuccess({
  subscriber,
  session,
}) {
  // persist the marketing consent in a cookie so it can be read in the newsletter form
  // to show if a user is already subscribed without having to make an API call
  session.set(
    'emailMarketingConsent',
    subscriber.emailMarketingConsent.marketingState,
  );
  return json(
    { subscriber, error: null },
    {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    },
  );
}

function returnError({ error }) {
  console.error(error.message);
  return json({ subscriber: null, error });
}

/**
 * Get a customer marketing consent by email
 * @param email
 * @param context
 */
async function getCustomerConsent({
  email,
  context,
}) {
    const graphqlQuery = `
    query getCustomerByEmail($email: String!) {
        customers(first: 1, query: $email) {
            edges {
                node {
                    id
                    email
                }
            }
        }
    }
    `;
  const {customers} = await context.admin(graphqlQuery, {email:email});
  const customer = customers?.edges[0]?.node;
  if (!customer) {
    return { customer: null, error: null };
  }
  return { customer, error: null };
}

/**
 * Update a customer's marketing consent
 * @param customerId
 * @param context
 */
async function updateCustomerMarketingConsent({
  customerId,
  context,
}) {
  const consentUpdatedAt = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000,
  ).toISOString();
  const UPDATE_CUSTOMER_MARKETING_CONSENT = `
  mutation ($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
        email
        emailMarketingConsent {
          consentUpdatedAt
          marketingOptInLevel
          marketingState
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

  const input = {
    customerId,
    emailMarketingConsent: {
      consentUpdatedAt,
      marketingOptInLevel: 'SINGLE_OPT_IN',
      marketingState: 'SUBSCRIBED',
    },
  };

  const { customerEmailMarketingConsentUpdate } = await context.admin( UPDATE_CUSTOMER_MARKETING_CONSENT,{ input });

  if (customerEmailMarketingConsentUpdate.userErrors.length) {
    const [{ field, message }] = customerEmailMarketingConsentUpdate.userErrors;
    return { error: { field, message }, customer: null };
  }

  // success
  return {
    customer: customerEmailMarketingConsentUpdate.customer,
    error: null,
  };
}

async function createSubscriber({
  email,
  context,
}) {
  const CREATE_SUBSCRIBER = `
  mutation ($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        emailMarketingConsent {
          consentUpdatedAt
          marketingOptInLevel
          marketingState
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
  const consentUpdatedAt = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000,
  ).toISOString();

  const input = {
    email,
    acceptsMarketing: true,
    // or smsMarketingConsent if subscribing via phone number
    emailMarketingConsent: {
      consentUpdatedAt,
      marketingOptInLevel: 'SINGLE_OPT_IN',
      marketingState: 'SUBSCRIBED',
    },
    tags: ['newsletter'],
  };

  const { customerCreate } = await context.admin(CREATE_SUBSCRIBER, {input});

  if (customerCreate.userErrors.length) {
    const [{ field, message }] = customerCreate.userErrors;
    return { error: { field, message }, customer: null };
  }

  // success
  const { customer } = customerCreate;
  return { customer, error: null };
}
