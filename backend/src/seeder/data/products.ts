export interface SeedProduct {
  images: string[];
  banners?: string[];
  title: string;
  description: string;
  price: number;
  countInStock: number;
  isFeatured?: string;
  rating: number;
  numReviews?: number;
}

const products: SeedProduct[] = [
  {
    images: ['aptekarka', 'aptekarka_2'],
    banners: ['aptekarka_3'],
    title: 'Aptekarka',
    description:
      'Szczypta zielarstwa, garść feminizmu w błyskotliwym romansie.',
    price: 49.99,
    countInStock: 2,
    isFeatured: 'true',
    rating: 4.5,
    numReviews: 12,
  },
  {
    images: ['cienwiatru', 'cienwiatru_2'],
    title: 'Cień wiatru',
    description:
      'Cmentarz Zapomnianych Książek, miejsce ukryte w samym sercu średniowiecznej części Barcelony...',
    price: 59.99,
    countInStock: 2,
    rating: 3.2,
    numReviews: 8,
  },
  {
    images: ['doktorsen', 'doktorsen_2'],
    banners: ['doktorsen_3'],
    title: 'Doktor Sen',
    description: 'Kontynuacja bestsellerowego Lśnienia!',
    price: 39.99,
    countInStock: 2,
    isFeatured: 'true',
    rating: 5,
    numReviews: 24,
  },
  {
    images: ['drzewoaniola', 'drzewoaniola_2'],
    title: 'Drzewo Anioła',
    description:
      'Saga pełna zawiłych relacji rodzinnych i mrocznych sekretów, które rzucają cień na kolejne pokolenia.',
    price: 69.99,
    countInStock: 2,
    rating: 2.1,
    numReviews: 5,
  },
  {
    images: ['estera', 'estera_2'],
    title: 'Estera',
    description: 'Opowieść o pięknie, które kruszy twarde serca tyranów.',
    price: 59.99,
    countInStock: 2,
    rating: 4,
    numReviews: 15,
  },
  {
    images: ['przekroczyćrzekę', 'przekroczyćrzekę_2'],
    title: 'Przekroczyć rzekę',
    description: '...',
    price: 49.99,
    countInStock: 2,
    rating: 1.5,
    numReviews: 3,
  },
  {
    images: ['rzym', 'rzym_2'],
    banners: ['rzym_3'],
    title: 'Starożytny Rzym',
    description:
      'Niezwykła i dramatyczna historia o tym jak mała, słaba osada stała się potęgą rządzącą światem śródziemnomorskim',
    price: 49.99,
    countInStock: 2,
    isFeatured: 'true',
    rating: 3.8,
    numReviews: 11,
  },
  {
    images: ['skrybazesieny', 'skrybazesieny_2'],
    title: 'Skryba ze Sieny',
    description:
      'Nowy Jork, wiek XXI. Po nagłej śmierci brata Beatrice dowiaduje się, że zostawił jej w spadku stary dom w Sienie...',
    price: 49.99,
    countInStock: 2,
    rating: 2.5,
    numReviews: 6,
  },
  {
    images: ['zimowyogród', 'zimowyogród_2'],
    title: 'Zimowy ogród',
    description:
      'Wciągający od pierwszej strony - epicka historia i jednocześnie kameralny portret kobiet na życiowym rozdrożu',
    price: 59.99,
    countInStock: 2,
    rating: 4.2,
    numReviews: 9,
  },
];

export default products;
