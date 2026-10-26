export const SAMPLE_CHAT = `[24/10/26, 14:02] Amara Okafor: Hi! Saw your new collection on Instagram 😍 I'd like to order
[24/10/26, 14:03] Luma Threads Studio: Hello Amara! Thank you 🙏 What would you like?
[24/10/26, 14:05] Amara Okafor: 2 x Linen wrap dress (size M, sage) at $45 each
[24/10/26, 14:05] Amara Okafor: 1 Silk headscarf - $18
[24/10/26, 14:06] Amara Okafor: and 3 beaded bracelets for $7.50 each
[24/10/26, 14:08] Luma Threads Studio: Lovely choices! Shipping is $12 flat
[24/10/26, 14:09] Amara Okafor: Perfect. Please send the invoice to amara.okafor@example.com
[24/10/26, 14:09] Luma Threads Studio: Will do, sending a PayPal invoice now ✨`;

const H = (b, s) => (l) => l.map(([w, t], i) => `[24/10/26, 14:0${i}] ${w ? b : s}: ${t}`).join('\n');
const B = 'Amara Okafor', S = 'Luma Threads Studio', E = 'amara.okafor@example.com';
export const SAMPLES = {
  en: SAMPLE_CHAT,
  fr: H(B, S)([[1, 'Bonjour ! J’adore votre nouvelle collection 😍'], [0, 'Merci Amara ! Que souhaitez-vous ?'], [1, '2 x Robe portefeuille en lin (taille M, sauge) à 45 $ chacune'], [1, '1 Foulard en soie - 18 $'], [1, 'et 3 bracelets perlés à 7,50 $ pièce'], [0, 'Parfait ! La livraison est à 12 $'], [1, 'Envoyez la facture à ' + E + ' merci']]),
  es: H(B, S)([[1, '¡Hola! Me encanta la nueva colección 😍'], [0, '¡Gracias Amara! ¿Qué te gustaría?'], [1, '2 x Vestido cruzado de lino (talla M, salvia) a $45 cada uno'], [1, '1 Pañuelo de seda - $18'], [1, 'y 3 pulseras de cuentas a $7.50 cada una'], [0, '¡Genial! El envío cuesta $12'], [1, 'Mándame la factura a ' + E]]),
  pt: H(B, S)([[1, 'Olá! Amei a nova coleção 😍'], [0, 'Obrigada, Amara! O que você gostaria?'], [1, '2 x Vestido transpassado de linho (tam. M, sálvia) por $45 cada'], [1, '1 Lenço de seda - $18'], [1, 'e 3 pulseiras de miçangas a $7.50 cada'], [0, 'Ótimo! O frete é $12'], [1, 'Pode mandar a fatura para ' + E]]),
  ar: H(B, S)([[1, 'مرحباً! أعجبتني المجموعة الجديدة 😍'], [0, 'شكراً أمارا! ماذا تودين أن تطلبي؟'], [1, '2 x فستان كتان ملفوف (مقاس M، أخضر) بسعر $45 للقطعة'], [1, '1 وشاح حرير - $18'], [1, 'و 3 أساور خرز بسعر $7.50 للواحدة'], [0, 'رائع! الشحن $12'], [1, 'أرسلي الفاتورة إلى ' + E]]),
  zh: H(B, S)([[1, '你好！很喜欢你们的新系列 😍'], [0, '谢谢 Amara！想要什么呢？'], [1, '2 x 亚麻裹身连衣裙（M码，鼠尾草绿）每件 $45'], [1, '1 真丝头巾 - $18'], [1, '还有 3 串珠手链，每串 $7.50'], [0, '好的！运费 $12'], [1, '发票请发到 ' + E]]),
  ha: H(B, S)([[1, 'Sannu! Ina son sabon kayanku 😍'], [0, 'Na gode Amara! Me kike so?'], [1, '2 x Rigar lilin (girma M, kore) a $45 kowace'], [1, '1 Gyalen siliki - $18'], [1, 'da 3 mundaye na duwatsu a $7.50 kowanne'], [0, 'To! Kudin aikawa $12'], [1, 'Ki aiko takardar kuɗi zuwa ' + E]]),
};
Object.assign(SAMPLES, {
  tr: H(B, S)([[1, 'Merhaba! Yeni koleksiyonunuza bayıldım 😍'], [0, 'Teşekkürler Amara! Ne istersiniz?'], [1, '2 x Keten kruvaze elbise (M beden, adaçayı yeşili) tanesi $45'], [1, '1 İpek eşarp - $18'], [1, 've 3 boncuklu bileklik tanesi $7.50'], [0, 'Harika! Kargo $12'], [1, 'Faturayı ' + E + ' adresine gönderin lütfen']]),
  de: H(B, S)([[1, 'Hallo! Ich liebe eure neue Kollektion 😍'], [0, 'Danke Amara! Was darf es sein?'], [1, '2 x Leinen-Wickelkleid (Größe M, salbeigrün) zu je 45 $'], [1, '1 Seidenkopftuch - 18 $'], [1, 'und 3 Perlenarmbänder zu je 7,50 $'], [0, 'Super! Der Versand kostet 12 $'], [1, 'Bitte schick die Rechnung an ' + E]]),
  id: H(B, S)([[1, 'Halo! Suka banget koleksi barunya 😍'], [0, 'Terima kasih Amara! Mau pesan apa?'], [1, '2 x Gaun lilit linen (ukuran M, hijau sage) $45 per buah'], [1, '1 Kerudung sutra - $18'], [1, 'dan 3 gelang manik $7.50 per buah'], [0, 'Siap! Ongkir $12'], [1, 'Kirim fakturnya ke ' + E + ' ya']]),
  ru: H(B, S)([[1, 'Здравствуйте! Очень нравится ваша новая коллекция 😍'], [0, 'Спасибо, Амара! Что вы хотите заказать?'], [1, '2 x Льняное платье с запахом (размер M, шалфейный) по $45 за штуку'], [1, '1 Шёлковый платок - $18'], [1, 'и 3 браслета из бусин по $7.50 за штуку'], [0, 'Отлично! Доставка $12'], [1, 'Пришлите счёт на ' + E]]),
  sw: H(B, S)([[1, 'Habari! Napenda sana mkusanyiko wenu mpya 😍'], [0, 'Asante Amara! Ungependa nini?'], [1, '2 x Gauni la kitani (saizi M, kijani) $45 kila moja'], [1, '1 Kitambaa cha hariri - $18'], [1, 'na 3 bangili za shanga $7.50 kila moja'], [0, 'Sawa! Usafirishaji ni $12'], [1, 'Tafadhali tuma ankara kwa ' + E]]),
});
