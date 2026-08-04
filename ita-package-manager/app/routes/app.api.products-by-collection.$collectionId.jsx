import { authenticate } from "../shopify.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const collectionId = decodeURIComponent(params.collectionId);

  const response = await admin.graphql(
    `#graphql
    query GetProductsByCollection($id: ID!) {
      collection(id: $id) {
        title
        products(first: 100) {
          edges {
            node {
              id
              title
              status
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { variables: { id: collectionId } },
  );

  const data = await response.json();
  const collection = data.data.collection;

  function toNumericId(gid) {
    if (!gid) return null;
    return gid.split("/").pop();
  }

  const products = (collection?.products?.edges || []).map((edge) => {
    const variant = edge.node.variants.edges[0]?.node;
    return {
      id: toNumericId(edge.node.id),
      title: edge.node.title,
      status: edge.node.status, // "ACTIVE" | "DRAFT" | "ARCHIVED"
      imageUrl: edge.node.featuredImage?.url || null,
      variantId: toNumericId(variant?.id),
      price: variant?.price || "0",
    };
  });

  return { collectionTitle: collection?.title || "", products };
}