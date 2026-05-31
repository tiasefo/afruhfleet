export interface GeoCountry {
  code: string
  name: string
  currency: string
  cities: string[]
}

export const GEO_COUNTRIES: GeoCountry[] = [
  {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    cities: [
      'Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi', 'Tema',
      'Sunyani', 'Ho', 'Koforidua', 'Wa', 'Bolgatanga', 'Techiman',
      'Tarkwa', 'Obuasi', 'Winneba', 'Kasoa', 'Ashaiman',
    ],
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    cities: [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
      'Meru', 'Nyeri', 'Kisii', 'Kericho', 'Garissa', 'Malindi',
      'Kitale', 'Machakos', 'Kakamega',
    ],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    cities: [
      'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City',
      'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu',
      'Warri', 'Kaduna', 'Owerri', 'Calabar', 'Uyo',
    ],
  },
  {
    code: 'CN',
    name: 'China',
    currency: 'CNY',
    cities: [
      'Shanghai', 'Guangzhou', 'Shenzhen', 'Beijing', 'Tianjin', 'Qingdao',
      'Ningbo', 'Wuhan', 'Chengdu', 'Hangzhou', 'Dongguan', 'Foshan',
      'Suzhou', 'Yiwu', 'Wenzhou', 'Xiamen',
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    cities: [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    cities: ['London', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Sheffield', 'Bristol'],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    cities: [
      'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
      'Bloemfontein', 'East London', 'Nelspruit',
    ],
  },
]

export const COUNTRY_MAP: Record<string, GeoCountry> = Object.fromEntries(
  GEO_COUNTRIES.map(c => [c.code, c])
)

export const COUNTRY_OPTIONS = GEO_COUNTRIES.map(c => ({
  value: c.code,
  label: c.name,
}))

export function getCitiesForCountry(countryCode: string): string[] {
  return COUNTRY_MAP[countryCode]?.cities ?? []
}
