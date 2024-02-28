import {Link} from '@remix-run/react';
export function WishlistIcon({id}) {
    return (
        <>
          <div className="wishlist" onClick="addProductToCustomer" style={mystyle}>
            <img className="w-100" src="https://cdn.shopify.com/s/files/1/0797/3421/0835/files/iconmonstr-heart-lined.svg?v=1705658473"/>
          </div>
        </>
    )
}
export function WishlistLink() {
    return (
        <>
          <Link to="/wishlist">Wishlist</Link>
        </>
    )
}
// Define GraphQL mutations
const ADD_PRODUCT_TO_CUSTOMER_METAFIELD = gql`
  mutation AddProductToCustomerMetafield($customerId: ID!, $productId: ID!) {
    customerUpdate(input: {
      id: $customerId
      metafields: [
        {key: "favorite_product_ids", value: $productId, namespace: "global"}
      ]
    }) {
      customer {
        id
        metafield(namespace: "global", key: "favorite_product_ids") {
          key
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const REMOVE_PRODUCT_FROM_CUSTOMER_METAFIELD = gql`
  mutation RemoveProductFromCustomerMetafield($customerId: ID!, $productId: ID!) {
    customerUpdate(input: {
      id: $customerId
      metafields: [
        {key: "favorite_product_ids", value: $productId, namespace: "global", delete: true}
      ]
    }) {
      customer {
        id
        metafield(namespace: "global", key: "favorite_product_ids") {
          key
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Function to add product to customer metafield
async function addProductToCustomer(customerId, productId) {
  try {
    const { data } = await client.mutate({
      mutation: ADD_PRODUCT_TO_CUSTOMER_METAFIELD,
      variables: { customerId, productId },
    });
    console.log('Product added to customer metafield:', data);
  } catch (error) {
    console.error('Error adding product to customer metafield:', error);
  }
}

// Function to remove product from customer metafield
async function removeProductFromCustomer(customerId, productId) {
  try {
    const { data } = await client.mutate({
      mutation: REMOVE_PRODUCT_FROM_CUSTOMER_METAFIELD,
      variables: { customerId, productId },
    });
    console.log('Product removed from customer metafield:', data);
  } catch (error) {
    console.error('Error removing product from customer metafield:', error);
  }
}
const mystyle = {
    width:"35px",
    position: "absolute",
    right: "15px",
    top: "15px",
    cursor: "pointer"
};
