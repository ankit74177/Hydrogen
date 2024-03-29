import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {ContactUs} from '~/components/ContactUs';
import {Section} from '~/components/PageSection';
/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, context}) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle: params.handle,
    },
  });

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  return json({page});
}

export default function Page() {
  /** @type {LoaderReturnData} */
  const {page} = useLoaderData();
  return (
    <div className="page">
      <header>
        <h1>{page.title}</h1>
      </header>
      {page.title=='Contact' ? (
        <ContactUs/>
      ):(<></>)}
      {(page.metafields.length&&page.metafields[0]&&page.metafields[0].key=='section') ? (
        <Section data={page.metafields[0].value}/>
      ):(<></>)}
      <main dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
      metafields(identifiers:[{ namespace: "custom", key: "section" }]) {
        id
        key
        value
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
