// Utility function to filter out non-system fields
export default function filterFields(dataArray, systemFields) {
  return dataArray.map((item) => {
    for (const key of Object.keys(item)) {
      if (!systemFields.includes(key)) {
        const value = item[key];
        if (Array.isArray(value)) {
          const isArrayOfIntegers = value.every((v) => Number.isInteger(v));
          const isArrayOfUUIDs = value.every(
            (v) =>
              typeof v === "string" &&
              /[\dA-Fa-f]{8}(?:-[\dA-Fa-f]{4}){3}-[\dA-Fa-f]{12}/.test(v)
          );
          if (isArrayOfIntegers || isArrayOfUUIDs) {
            item[key] = null; // or item[key] = [];
          }
        }
      }
    }

    return item;
  });
}
