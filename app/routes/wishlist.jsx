import { useLoaderData,Link } from '@remix-run/react';
import { json, redirect } from '@shopify/remix-oxygen';
import { useVariantUrl } from '~/utils';
import {
    Image,
    Money
  } from '@shopify/hydrogen';
export async function loader({ context }) {
    const { session, storefront } = context;
    const customerAccessToken = await session.get('customerAccessToken');
    const isLoggedIn = !!customerAccessToken?.accessToken;
    if (!isLoggedIn) {
        session.unset('customerAccessToken');
        return redirect('/account/login', {
            headers: {
                'Set-Cookie': await session.commit(),
            },
        });
    }

    try {
        const { customer } = await storefront.query(CUSTOMER_QUERY, {
            variables: {
                customerAccessToken: customerAccessToken.accessToken,
                country: storefront.i18n.country,
                language: storefront.i18n.language,
            },
            cache: storefront.CacheNone(),
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        localStorage.setItem('customer_meta', customer.metafields);
        let products = {
            nodes:[]
        }
        if (customer.metafields) {
            products = await storefront.query(PRODUCT_QUERY, {
                variables: { "ids": JSON.parse(customer.metafields[0].value).wishlist }
            });
        }
        return json(
            { isLoggedIn, customer ,products},
            {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            },
        );
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('There was a problem loading account', error);
        session.unset('customerAccessToken');
        return redirect('/account/login', {
            headers: {
                'Set-Cookie': await session.commit(),
            },
        });
    }
}

export default function Acccount() {
    /** @type {LoaderReturnData} */
    const { customer,products } = useLoaderData();


    return (
        <div className="account">
            <h1>Wishlist</h1>
            <ProductsGrid products={products.nodes} />
        </div>
    );
}

function ProductsGrid({ products }) {
    return (
      <div className="products-grid">
        {products.map((product, index) => {
          return (
            <ProductItem
              key={product.id}
              product={product}
            />
          );
        })}
      </div>
    );
  }

  function ProductItem({ product }) {
    console.log(product)
    const variant = product.variants;
    const variantUrl = useVariantUrl(product.handle, variant.nodes[0].selectedOptions);
    return (
      <div className="product-item">
        {product.variants.nodes[0].image && (
          <Link
            key={product.id}
            prefetch="intent"
            to={variantUrl}
          >
            <Image
              alt={product.variants.nodes[0].image.altText || product.title}
              data={product.variants.nodes[0].image}
            />
          </Link>
        )}
        <Link
            key={product.id}
            prefetch="intent"
            to={variantUrl}
          ><h4>{product.title}</h4></Link>
        <div className="product-price">
          {product.variants.nodes[0]?.compareAtPrice ? (
            <>
              <p className='saleicon'>Sale</p>
              <div className="product-price-on-sale">
                {product.variants.nodes[0] ? <Money data={product.variants.nodes[0].price} /> : null}
                <s>
                  <Money data={product.variants.nodes[0].compareAtPrice} />
                </s>
              </div>
            </>
          ) : (
            product.variants.nodes[0]?.price && <Money data={product.variants.nodes[0]?.price} />
          )}
        </div>
      </div>
    );
  }
  
export const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    metafields(identifiers:[{ namespace: "custom", key: "wishlist" }]) {
        id
        key
        value
      }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/customer
const CUSTOMER_QUERY = `#graphql
  query Customer(
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
`;
const PRODUCT_QUERY = `
query Products($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        variants(first: 1) {
        nodes {
            availableForSale
            compareAtPrice {
            amount
            currencyCode
            }
            id
            image {
            __typename
            id
            url
            altText
            width
            height
            }
            price {
            amount
            currencyCode
            }
            product {
            title
            handle
            }
            selectedOptions {
            name
            value
            }
            sku
            title
            unitPrice {
            amount
            currencyCode
            }
        }
        }
        seo {
        description
        title
        }
      }
    }
  }
`;

// /** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
// /** @typedef {import('storefrontapi.generated').CustomerFragment} CustomerFragment */
// /** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */

// /** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
// /** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
// /** @typedef {import('@remix-run/react').FetcherWithComponents} FetcherWithComponents */
// /** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
// /** @typedef {import('storefrontapi.generated').ProductVariantsQuery} ProductVariantsQuery */
// /** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
// /** @typedef {import('@shopify/hydrogen').VariantOption} VariantOption */
// /** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineInput} CartLineInput */
// /** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
// /** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
