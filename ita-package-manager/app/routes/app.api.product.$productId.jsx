import { authenticate } from "../shopify.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const productId = decodeURIComponent(params.productId);

  const response = await admin.graphql(
    `#graphql
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        status
        description
        featuredImage {
          url
          altText
        }
        variants(first: 1) {
          edges {
            node {
              id
              price
            }
          }
        }
        collections(first: 5) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }`,
    { variables: { id: productId } },
  );

  const data = await response.json();
  const product = data.data.product;

  return {
    product: product
      ? {
          id: product.id,
          title: product.title,
          status: product.status,
          description: product.description,
          imageUrl: product.featuredImage?.url || null,
          imageAlt: product.featuredImage?.altText || null,
          variantId: product.variants.edges[0]?.node.id || null,
          price: product.variants.edges[0]?.node.price || "0",
          collections: product.collections.edges.map((e) => ({
            id: e.node.id,
            title: e.node.title,
          })),
        }
      : null,
  };
}
