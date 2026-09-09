export const DEFAULT_FIT = 'Replica';
export const DEFAULT_SLEEVE = 'Short Sleeve';

const SIZES = ['S', 'M', 'L'];

function jersey(id, name, price, file, description) {
  return {
    id,
    name,
    category: "Men's Jersey",
    price,
    discountPercent: 0,
    isNew: true,
    sizes: SIZES,
    image: `assets/jerseys/${file}`,
    images: [`assets/jerseys/${file}`],
    description,
  };
}

export const SHOP_DATA = {
  shopName: 'Jersey Drop',
  whatsappNumber: '251991073772',
  telegramUsername: '+251991073772',
  telebirrNumber: '0991073772',
  cbeAccount: '1000123456789',
  deliveryCity: 'Addis Ababa',
  deliveryFrom: 'Ayat 49',
  // Ordered by distance from Ayat 49. `estimated: true` fees are interpolated
  // between the three real Yango quotes (Bole 356, Arat Kilo 372, Jemo 561) and
  // deliberately rounded up, so a wrong guess costs the customer a little rather
  // than costing the shop on every order. Replace them with real quotes as you
  // get them, and drop the estimated flag when you do.
  deliveryZones: [
    { id: 'ayat', name: 'Ayat / Summit / CMC', fee: 260, estimated: true },
    { id: 'megenagna', name: 'Megenagna / Gerji / Gurd Shola', fee: 320, estimated: true },
    { id: 'bole', name: 'Bole / Medhanialem / Kazanchis', fee: 356 },
    { id: 'arat-kilo', name: 'Arat Kilo / Sidist Kilo / Piassa', fee: 372 },
    { id: 'mexico', name: 'Mexico / Sarbet / Old Airport / Merkato', fee: 450, estimated: true },
    { id: 'saris', name: 'Saris / Lebu / Kolfe / Torhailoch', fee: 510, estimated: true },
    { id: 'jemo', name: 'Jemo', fee: 561 },
    { id: 'other', name: 'Other area in Addis', fee: null },
  ],
  products: [
    jersey('arsenal-home', 'Arsenal Home', 3200, 'arsenal-home.webp', 'Arsenal home kit in the classic red and white.'),
    jersey('arsenal-away', 'Arsenal Away', 3250, 'arsenal-away.webp', 'Arsenal away kit for the season.'),
    jersey('arsenal-third', 'Arsenal Third', 3200, 'arsenal-third.webp', 'Arsenal third kit.'),

    jersey('barcelona-home', 'Barcelona Home', 3200, 'barcelona-home.webp', 'Barcelona home kit in the club colours.'),
    jersey('barcelona-away', 'Barcelona Away', 3250, 'barcelona-away.webp', 'Barcelona away kit for the season.'),
    jersey('barcelona-third', 'Barcelona Third', 3300, 'barcelona-third.webp', 'Barcelona third kit.'),

    jersey('chelsea-home', 'Chelsea Home', 3250, 'chelsea-home.webp', 'Chelsea home kit in the classic blue.'),
    jersey('chelsea-away', 'Chelsea Away', 3300, 'chelsea-away.webp', 'Chelsea away kit for the season.'),

    jersey('liverpool-home', 'Liverpool Home', 3200, 'liverpool-home.webp', 'Liverpool home kit in the classic red.'),
    jersey('liverpool-away', 'Liverpool Away', 3250, 'liverpool-away.webp', 'Liverpool away kit for the season.'),

    jersey('madrid-home', 'Real Madrid Home', 3200, 'madrid-home.webp', 'Real Madrid home kit in the classic white.'),
    jersey('madrid-away', 'Real Madrid Away', 3250, 'madrid-away.webp', 'Real Madrid away kit for the season.'),
    jersey('madrid-third', 'Real Madrid Third', 3300, 'madrid-third.webp', 'Real Madrid third kit.'),

    jersey('man-city-home', 'Man City Home', 3200, 'man-city-home.webp', 'Manchester City home kit in sky blue.'),
    jersey('man-city-away', 'Man City Away', 3250, 'man-city-away.webp', 'Manchester City away kit for the season.'),
    jersey('man-city-third', 'Man City Third', 3200, 'man-city-third.webp', 'Manchester City third kit.'),

    jersey('man-united-home', 'Man United Home', 3200, 'man-united-home.webp', 'Manchester United home kit in the classic red.'),
    jersey('man-united-away', 'Man United Away', 3200, 'man-united-away.webp', 'Manchester United away kit for the season.'),
    jersey('man-united-third', 'Man United Third', 3300, 'man-united-third.webp', 'Manchester United third kit.'),
  ],
};
