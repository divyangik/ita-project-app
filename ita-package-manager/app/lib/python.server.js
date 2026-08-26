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

export async function updateTourDate(dateId, data) {
  const response = await fetch(`${BASE_URL}/tour-dates/${dateId}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function setDefaultTourDate(dateId)
 {  const response = await fetch(`${BASE_URL}/tour-dates/${dateId}/set-default`, {
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

// -------------------- Package Countries --------------------

export async function getPackageCountries(packageId, shop) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}/countries?shop=${encodeURIComponent(shop)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function addPackageCountry(packageId, shop, data) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}/countries?shop=${encodeURIComponent(shop)}`,
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

export async function deletePackageCountry(packageId, countryId, shop) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}/countries/${countryId}?shop=${encodeURIComponent(shop)}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// -------------------- Package Cities --------------------

export async function getPackageCities(packageId, shop) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}/cities?shop=${encodeURIComponent(shop)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function addPackageCity(packageId, shop, data) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}/cities?shop=${encodeURIComponent(shop)}`,
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

export async function deletePackageCity(packageId, cityId, shop) {
  const response = await fetch(
    `${BASE_URL}/packages/${packageId}/cities/${cityId}?shop=${encodeURIComponent(shop)}`,
    {
      method: "DELETE",
      headers,
    },
  );

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

// -------------------- Include Options (shop-level library) --------------------

export async function getIncludeOptions(shop) {
  const response = await fetch(
    `${BASE_URL}/include-options?shop=${encodeURIComponent(shop)}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createIncludeOption(shop, data) {
  const response = await fetch(
    `${BASE_URL}/include-options?shop=${encodeURIComponent(shop)}`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create include option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function updateIncludeOption(optionId, data) {
  const response = await fetch(`${BASE_URL}/include-options/${optionId}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to update include option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function deleteIncludeOption(optionId) {
  const response = await fetch(`${BASE_URL}/include-options/${optionId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to delete include option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

// -------------------- Guest Category Options (Package Type / Traveller / Tour Type) --------------------

export async function getGuestCategoryOptions(shop, kind) {
  const params = new URLSearchParams({ shop });
  if (kind) params.set("kind", kind);

  const response = await fetch(`${BASE_URL}/guest-category-options?${params}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createGuestCategoryOption(shop, data) {
  const response = await fetch(
    `${BASE_URL}/guest-category-options?shop=${encodeURIComponent(shop)}`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create guest category option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function updateGuestCategoryOption(optionId, data) {
  const response = await fetch(
    `${BASE_URL}/guest-category-options/${optionId}`,
    {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to update guest category option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

export async function deleteGuestCategoryOption(optionId) {
  const response = await fetch(
    `${BASE_URL}/guest-category-options/${optionId}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to delete guest category option: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

// -------------------- Package Include Selections --------------------

export async function getPackageIncludeSelections(packageId) {
  const response = await fetch(
    `${BASE_URL}/package-include-selections/${packageId}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function savePackageIncludeSelections(packageId, optionIds) {
  const response = await fetch(
    `${BASE_URL}/package-include-selections/${packageId}`,
    {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify({ option_ids: optionIds }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to save include selections: ${response.status} ${errorBody}`,
    );
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

export async function getTourItinerary(packageId) {
  const response = await fetch(`${BASE_URL}/tour-itinerary/${packageId}`, { headers });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to load itinerary: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function saveTourItinerary(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-itinerary/${packageId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to save itinerary: ${response.status} ${errorBody}`);
  }

  return response.json();
}
export async function uploadItineraryPdf(packageId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/tour-itinerary/${packageId}/upload-pdf`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to upload itinerary PDF: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function deleteItineraryPdf(packageId) {
  const response = await fetch(`${BASE_URL}/tour-itinerary/${packageId}/pdf`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete itinerary PDF: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function getProductAddons(packageId) {
  const response = await fetch(`${BASE_URL}/tour-product-addons/${packageId}`, { headers });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to load product addons: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function createProductAddon(packageId, data) {
  const response = await fetch(`${BASE_URL}/tour-product-addons/${packageId}`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to add product addon: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function deleteProductAddon(addonId) {
  const response = await fetch(`${BASE_URL}/tour-product-addons/${addonId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete product addon: ${response.status} ${errorBody}`);
  }

  return response.json();
}