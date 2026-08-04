// app/routes/app.api.collections.jsx
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
      query GetCollections {
        collections(first: 100) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }`,
    );

    const data = await response.json();

    if (data.errors) {
      return { collections: [], error: JSON.stringify(data.errors) };
    }

    const collections = data.data.collections.edges.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
    }));

    return { collections };
  } catch (err) {
    return { collections: [], error: err.message };
  }
}
