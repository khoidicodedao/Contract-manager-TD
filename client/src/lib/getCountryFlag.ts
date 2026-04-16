const getCountryFlagUrl = (countryCode: string | null): string => {
  const code = countryCode?.trim().toLowerCase() || "un";

  return `/flags/4x3/${code}.svg`;
};

export default getCountryFlagUrl;
