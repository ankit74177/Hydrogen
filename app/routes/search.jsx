import {defer} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {SearchForm, SearchResults, NoSearchResults} from '~/components/Search';
import {SortMenu} from '~/components/SortBy';
/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: `Hydrogen | Search`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const {sortKey, reverse} = getSortValuesFromParam(
    searchParams.get('sort')
  );
  const paginationVariables = getPaginationVariables(request, {
    pageBy:12
  });
  const searchTerm = String(searchParams.get('q') || '');

  if (!searchTerm) {
    return {
      searchResults: {results: null, totalResults: 0},
      searchTerm,
    };
  }

  const data = await context.storefront.query(SEARCH_QUERY, {
    variables: {
      query: searchTerm,
      sortKey, reverse,
      ...paginationVariables,
    },
  });

  if (!data) {
    throw new Error('No search data returned from Shopify API');
  }

  const totalResults = Object.values(data).reduce((total, value) => {
    return total + value.nodes.length;
  }, 0);

  const searchResults = {
    results: data,
    totalResults,
  };

  return defer({searchTerm, searchResults});
}

export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {searchTerm, searchResults} = useLoaderData();

  return (
    <div className="search">
      <h1>Search</h1>
      <SearchForm searchTerm={searchTerm} />
      <div className='collection-sorting'>
        <SortMenu/>
      </div>
      {!searchTerm || !searchResults.totalResults ? (
        <NoSearchResults />
      ) : (
        <SearchResults results={searchResults.results} />
      )}
    </div>
  );
}

function getSortValuesFromParam(sortParam){
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
    // case 'best-selling':
    //   return {
    //     sortKey: 'BEST_SELLING',
    //     reverse: false,
    //   };
    // case 'newest':
    //   return {
    //     sortKey: 'CREATED',
    //     reverse: true,
    //   };
    case 'featured':
      return {
        sortKey: 'RELEVANCE',
        reverse: false,
      };
    default:
      return {
        sortKey: 'RELEVANCE',
        reverse: false,
      };
  }
}

const SEARCH_QUERY = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
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
      }
    }
  }
  query search(
    $query: String!
    $sortKey: SearchSortKeys!
    $reverse: Boolean
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $query
      sortKey: $sortKey
      reverse: $reverse
      unavailableProducts: HIDE,
      types: [PRODUCT],
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
