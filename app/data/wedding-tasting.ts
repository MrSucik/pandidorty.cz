export const WEDDING_TASTING_DATA = {
  cakeBox: {
    name: "Ochutnávka dortů",
    price: 550,
    description: "Krabička obsahuje 6 nejoblíbenějších příchutí",
    items: [
      "vanilkový korpus, vanilkový krém + rozvar z lesního ovoce",
      "čokoládový korpus, čokoládový krém + maliny",
      "red velvet korpus, vanilkový krém + maliny",
      "čokoládový korpus, krém kokos & bílá čokoláda",
      "vanilkový korpus, pistáciový krém + mango&marakuja curd a maliny",
      "čokoládový korpus, karamelový krém + jahody a karamel",
    ],
    maxOrders: 15, // Maximum orders per type as requested by client
  },
  sweetbarBox: {
    name: "Ochutnávka sweetbaru",
    price: 750,
    description: "Krabička obsahuje 16 nejoblíbenějších zákusků",
    items: [
      "karamelový mini větrníček",
      "malinová a karamelová makronka",
      "pistáciová a čokoládovo-karamelová tartaletka",
      "oříškový francouzský větrníček",
      "žloutkový věneček",
      "panna cotta vanilka & lesní ovoce",
      "perníčkový cake pop",
      "čokoládový dortový nanuk",
      "red velvet cupcake",
      "mini cheesecake čokoláda & lesní ovoce",
      "míša kelímek",
      "pavlova mango & marakuja",
      "tiramisu v kelímku",
      "brownies",
    ],
    maxOrders: 15, // Maximum orders per type as requested by client
  },
  payment: {
    deposit: 450, // Deposit amount in CZK
    description: "Objednávka je platná až po uhrazení zálohy 450 Kč převodem na účet, doplatek je pak v hotovosti na místě při převzetí",
    qrCodePath: "/payments/payment-qr.jpg", // Universal QR code for all payments
  },
  pickup: {
    date: "v sobotu 25.10.",
    time: "od 10-11 hod",
    location: "v Ostravě-Porubě (Maďarská 6088/18)",
  },
  orderDeadline: "do úterý 21.10. anebo do naplnění kapacity",
  message: "Děkujeme a budeme se na Vás moc těšit!",
} as const;

export type WeddingTastingData = typeof WEDDING_TASTING_DATA;