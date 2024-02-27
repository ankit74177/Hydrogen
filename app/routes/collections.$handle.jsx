import { json, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { SortMenu, FiltersDrawer } from '~/components/SortBy';
import { flattenConnection } from '@shopify/hydrogen';
import React, { useEffect } from "react";
import { WishlistIcon } from '~/components/WishList';
import {
  Pagination,
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/utils';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

/**
 * @param {LoaderFunctionArgs}
 */

let apiCall = false;
export async function loader({ request, params, context }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12
  });
  if (!handle) {
    return redirect('/collections');
  }
  const searchParams = new URL(request.url).searchParams;
  const knownFilters = ['productVendor', 'productType', 'tag'];
  const available = 'available';
  const variantOption = 'variantOption';
  const { sortKey, reverse } = getSortValuesFromParam(
    searchParams.get('sort')
  );
  const filters = [];
  const appliedFilters = [];
  for (const [key, value] of searchParams.entries()) {
    if (available === key) {
      filters.push({ available: value === 'true' });
      appliedFilters.push({
        label: value === 'true' ? 'In stock' : 'Out of stock',
        urlParam: {
          key: available,
          value,
        },
      });
    } else if (knownFilters.includes(key)) {
      filters.push({ [key]: value });
      appliedFilters.push({ label: value, urlParam: { key, value } });
    } else if (key.includes(variantOption)) {
      const [name, val] = value.split(':');
      filters.push({ variantOption: { name, value: val } });
      appliedFilters.push({ label: val, urlParam: { key, value } });
    }
  }
  if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
    const price = {};
    if (searchParams.has('minPrice')) {
      price.min = Number(searchParams.get('minPrice')) || 0;
      appliedFilters.push({
        label: `Min: $${price.min}`,
        urlParam: { key: 'minPrice', value: searchParams.get('minPrice') },
      });
    }
    if (searchParams.has('maxPrice')) {
      price.max = Number(searchParams.get('maxPrice')) || 0;
      appliedFilters.push({
        label: `Max: $${price.max}`,
        urlParam: { key: 'maxPrice', value: searchParams.get('maxPrice') },
      });
    }
    filters.push({
      price,
    });
  }
  const { collection, collections } = await storefront.query(COLLECTION_QUERY, {
    variables: { handle, sortKey, filters, reverse, ...paginationVariables },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  const collectionNodes = flattenConnection(collections);
  return json(
    {
      collection,
      appliedFilters,
      collections: collectionNodes
    },
  );
}

export default function Collection() {
  const handleScroll = () => {
    const nextinfiniteScrollElement = document.getElementById('next-infinite-scroll');
    const previnfiniteScrollElement = document.getElementById('prev-infinite-scroll');
    if (nextisInViewport(nextinfiniteScrollElement) && apiCall) {
      apiCall = false
      nextinfiniteScrollElement.click();
    }
    if (previsInViewport(previnfiniteScrollElement) && apiCall) {
      apiCall = false
      previnfiniteScrollElement.click();
    }
  };
  const nextisInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
  };
  const previsInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0
    );
  };
  useEffect(() => {
    if (apiCall) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  });


  /** @type {LoaderReturnData} */
  const { collection, collections, appliedFilters } = useLoaderData();
  apiCall = true;
  return (
    <div className="collection">
      <div className="collection-header">
        <CollectionHeader collection={collection} />
      </div>
      <div className='flex mt-25'>
        <div className='collection-filer'>
          <FiltersDrawer filters={collection.products.filters} appliedFilters={appliedFilters} collections={collections} />
        </div>
        <div className='collection-products'>
          <SortMenu />
          <Pagination connection={collection.products}>
            {({ nodes, isLoading, PreviousLink, NextLink }) => (
              <>
                <PreviousLink id='prev-infinite-scroll'>
                  {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                </PreviousLink>
                <ProductsGrid products={nodes} />
                <NextLink id='next-infinite-scroll'>
                  {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                </NextLink>
              </>
            )}
          </Pagination>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{products: ProductItemFragment[]}}
 */
function ProductsGrid({ products }) {
  return (
    <div className="products-grid">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 9 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

function CollectionHeader({ collection }) {
  return (
    <>
      {(collection.description != '' && collection.image) ? (
        <div className='row flex collection-header-bg'>
          <div className='column w-100'>
            <h1>{collection.title}</h1>
            <p className="collection-description">{collection.description}</p>
          </div>
          <div className='column w-100 m-0 p-0'>
            <Image
              className='w-100 m-0 d-block'
              alt={collection.title}
              data={collection.image}
            />
          </div>
        </div>
      ) : (collection.description != '' && !collection.image) ? (
        <div className='row flex'>
          <div className='column  w-100 text-left'>
            <h1>{collection.title}</h1>
            <p className="collection-description">{collection.description}</p>
          </div>
        </div>
      ) : (collection.description == '' && collection.image) ? (
        <div className='row flex'>
          <div className='w-100'>
            <Image
              className='w-100'
              alt={collection.title}
              data={collection.image}
            />
          </div>
        </div>
      ) : (<div className='row flex collection-header-bg'>
        <div className='column w-100 text-center'>
          <h1>{collection.title}</h1>
        </div>
      </div>)

      }
    </>
  )
}


function getSortValuesFromParam(sortParam) {
  switch (sortParam) {
    case 'price-high-low':
      return {
        sortKey: 'PRICE',
        reverse: true,
      };
    case 'price-low-high':
      return {
        sortKey: 'PRICE',
        reverse: false,
      };
    case 'best-selling':
      return {
        sortKey: 'BEST_SELLING',
        reverse: false,
      };
    case 'newest':
      return {
        sortKey: 'CREATED',
        reverse: true,
      };
    case 'featured':
      return {
        sortKey: 'MANUAL',
        reverse: false,
      };
    default:
      return {
        sortKey: 'RELEVANCE',
        reverse: false,
      };
  }
}
/**
 * @param {{
 *   product: ProductItemFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
function ProductItem({ product, loading }) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  return (
    <div className="product-item">
      <WishlistIcon id={product.id} />
      {product.featuredImage && (
        <Link
          key={product.id}
          prefetch="intent"
          to={variantUrl}
        >
          <Image
            alt={product.featuredImage.altText || product.title}
            data={product.featuredImage}
            loading={loading}
          />
        </Link>
      )}
      <Link
          key={product.id}
          prefetch="intent"
          to={variantUrl}
        ><h4>{product.title}</h4></Link>
      {/* <small><Money data={product.variants.nodes[0].price} /> */}
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
// const activeItem = params.get("sortKey");
const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    descriptionHtml
    productType
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        image {
          url
          altText
          width
          height
        }
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $filters: [ProductFilter!]
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
        ){
          filters {
            id
            label
            type
            values {
              id
              label
              count
              input
            }
          }
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
    collections(first: 100) {
      edges {
        node {
          title
          handle
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
