const BASE_URL = process.env.PYTHON_SERVICE_URL;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

const headers = {
  "x-internal-key": INTERNAL_KEY,
};

const jsonHeaders = {
  "Content-Type": "application/json",
  "x-internal-key": INTERNAL_KEY,
};

// -------------------- Packages --------------------

export async function getPackages(shop) {
  const response = await fetch(
    `${BASE_URL}/packages?shop=${encodeURIComponent(shop)}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getPackage({ id, shop }) {
  const response = await fetch(
    `${BASE_URL}/packages/${id}?shop=${encodeURIComponent(shop)}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createPackage(shop, data) {
  const response = await fetch(
    `${BASE_URL}/packages?shop=${encodeURIComponent(shop)}`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
export async function updatePackage(packageId, data) {
  const response = await fetch(`${BASE_URL}/packages/${packageId}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to update package: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}
export async function deletePackage(packageId, shop) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}?shop=${encodeURIComponent(shop)}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to delete package: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

// -------------------- Dashboard --------------------

export async function getDashboard(shop) {
  const response = await fetch(
    `${BASE_URL}/dashboard?shop=${encodeURIComponent(shop)}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// -------------------- Tour Info --------------------

export async function getTourInfo(packageId) {
  const response = await fetch(`${BASE_URL}/tour-info/${packageId}`, {
    headers,
  });

  if (response.status === 404) {
    return {};
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function saveTourInfo(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-info/${packageId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// -------------------- Tour Dates --------------------

export async function getTourDates(packageId) {
  const response = await fetch(
    `${BASE_URL}/tour-dates?package_id=${packageId}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createTourDate(data) {
  const response = await fetch(`${BASE_URL}/tour-dates`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function setDefaultTourDate(dateId) {
  const response = await fetch(`${BASE_URL}/tour-dates/${dateId}/set-default`, {
    method: "PATCH",
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function deleteTourDate(dateId) {
  const response = await fetch(`${BASE_URL}/tour-dates/${dateId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// -------------------- Tour Capacity --------------------

export async function getTourCapacity(packageId) {
  const response = await fetch(`${BASE_URL}/tour-capacity/${packageId}`, {
    headers,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to load tour capacity: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function saveTourCapacity(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-capacity/${packageId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to save tour capacity: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}
// -------------------- Tour Pricing --------------------

export async function getTourPricing(packageId) {
  const response = await fetch(`${BASE_URL}/tour-pricing/${packageId}`, {
    headers,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to load tour pricing: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function saveTourPricing(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-pricing/${packageId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to save tour pricing: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

// -------------------- Tour Payment Option --------------------

export async function getTourPayment(packageId) {
  const response = await fetch(`${BASE_URL}/tour-payment/${packageId}`, {
    headers,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to load payment option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function saveTourPayment(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-payment/${packageId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to save payment option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

// -------------------- Guest Addons --------------------

export async function getGuestAddons(packageId) {
  const response = await fetch(`${BASE_URL}/tour-addons/${packageId}`, {
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to load addons: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function createGuestAddon(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-addons/${packageId}`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create addon: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function updateGuestAddon(addonId, data) {
  const response = await fetch(`${BASE_URL}/tour-addons/${addonId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to update addon: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function deleteGuestAddon(addonId) {
  const response = await fetch(`${BASE_URL}/tour-addons/${addonId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete addon: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function getTourIncludes(packageId) {
  const response = await fetch(`${BASE_URL}/tour-includes/${packageId}`, {
    headers,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to load includes: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function saveTourIncludes(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-includes/${packageId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to save includes: ${response.status} ${errorBody}`);
  }

  return response.json();
}

// -------------------- Enquiries --------------------

export async function getEnquiries(shop) {
  const response = await fetch(
    `${BASE_URL}/enquiries?shop=${encodeURIComponent(shop)}`,
    {
      headers: jsonHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createEnquiry(shop, data) {
  const response = await fetch(
    `${BASE_URL}/enquiries?shop=${encodeURIComponent(shop)}`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function updateEnquiryResponded(shop, id, leadResponded) {
  const response = await fetch(
    `${BASE_URL}/enquiries/${id}/respond?shop=${encodeURIComponent(shop)}`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ lead_responded: leadResponded }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function respondToEnquiry(shop, id, leadResponded) {
  const response = await fetch(
    `${BASE_URL}/enquiries/${id}/respond?shop=${encodeURIComponent(shop)}`,
    {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify({ lead_responded: leadResponded }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getStorefrontPackage(shopifyProductId) {
  const response = await fetch(
    `${BASE_URL}/storefront/package/${encodeURIComponent(shopifyProductId)}`,
    { headers },
  );

  if (response.status === 404) {
    throw new Error("Package not found");
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

