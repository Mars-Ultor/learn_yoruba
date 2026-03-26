import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Yoruba learning data...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo_user',
      password: hashedPassword,
      streak: 5,
      totalPoints: 1250,
      level: 3,
    },
  });

  console.log('Created demo user:', demoUser);

  // Lesson 1: Basic Greetings
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 'lesson-greetings' },
    update: {},
    create: {
      id: 'lesson-greetings',
      title: 'Ẹ kú àárọ̀ - Basic Greetings',
      description: 'Learn essential Yoruba greetings for daily conversations',
      category: 'conversation',
      difficulty: 'beginner',
      order: 1,
      phrases: {
        create: [
          {
            yoruba: 'Ẹ kú àárọ̀',
            pronunciation: 'Eh koo ah-ah-raw',
            english: 'Good morning',
            context: 'Formal morning greeting, used until midday',
            order: 1,
          },
          {
            yoruba: 'Ẹ kú ọ̀sán',
            pronunciation: 'Eh koo aw-shahn',
            english: 'Good afternoon',
            context: 'Greeting used during the afternoon hours',
            order: 2,
          },
          {
            yoruba: 'Ẹ kú irọ́lẹ́',
            pronunciation: 'Eh koo ee-raw-leh',
            english: 'Good evening',
            context: 'Greeting used in the evening',
            order: 3,
          },
          {
            yoruba: 'Ẹ kú alẹ́',
            pronunciation: 'Eh koo ah-leh',
            english: 'Good night',
            context: 'Used when parting at night or going to bed',
            order: 4,
          },
          {
            yoruba: 'Báwo ni?',
            pronunciation: 'Bah-woh nee?',
            english: 'How are you?',
            context: 'Informal way to ask how someone is doing',
            order: 5,
          },
          {
            yoruba: 'Mo wà dáadáa',
            pronunciation: 'Moh wah dah-ah-dah-ah',
            english: 'I am fine',
            context: 'Response to "How are you?"',
            order: 6,
          },
        ],
      },
    },
  });

  // Lesson 2: Introducing Yourself
  const lesson2 = await prisma.lesson.upsert({
    where: { id: 'lesson-intro' },
    update: {},
    create: {
      id: 'lesson-intro',
      title: 'Ìfihàn Ara Ẹni - Introducing Yourself',
      description: 'Learn how to introduce yourself in Yoruba',
      category: 'conversation',
      difficulty: 'beginner',
      order: 2,
      phrases: {
        create: [
          {
            yoruba: 'Orúkọ mi ni...',
            pronunciation: 'Oh-roo-kaw mee nee...',
            english: 'My name is...',
            context: 'Standard way to introduce your name',
            order: 1,
          },
          {
            yoruba: 'Kí ni orúkọ rẹ?',
            pronunciation: 'Key nee oh-roo-kaw reh?',
            english: 'What is your name?',
            context: 'Asking someone their name',
            order: 2,
          },
          {
            yoruba: 'Inú mi dùn láti pàdé rẹ',
            pronunciation: 'Ee-noo mee doon lah-tee pah-deh reh',
            english: 'Nice to meet you',
            context: 'Said when meeting someone for the first time',
            order: 3,
          },
          {
            yoruba: 'Mo ti ń gbé ní...',
            pronunciation: 'Moh tee n gbeh nee...',
            english: 'I live in...',
            context: 'Telling someone where you live',
            order: 4,
          },
          {
            yoruba: 'Mo wá láti...',
            pronunciation: 'Moh wah lah-tee...',
            english: 'I am from...',
            context: 'Stating your origin or hometown',
            order: 5,
          },
        ],
      },
    },
  });

  // Lesson 3: At the Market
  const lesson3 = await prisma.lesson.upsert({
    where: { id: 'lesson-market' },
    update: {},
    create: {
      id: 'lesson-market',
      title: 'Ní Ọjà - At the Market',
      description: 'Practice buying and bargaining at a Yoruba market',
      category: 'conversation',
      difficulty: 'intermediate',
      order: 3,
      phrases: {
        create: [
          {
            yoruba: 'Ẹ̀ló ni èyí?',
            pronunciation: 'Eh-law nee eh-yee?',
            english: 'How much is this?',
            context: 'Asking the price of an item',
            order: 1,
          },
          {
            yoruba: 'Ó wọ́n jù',
            pronunciation: 'Aw won joo',
            english: 'It is too expensive',
            context: 'Expressing that the price is too high',
            order: 2,
          },
          {
            yoruba: 'Ẹ dín owó rẹ̀ kù',
            pronunciation: 'Eh deen oh-waw reh koo',
            english: 'Please reduce the price',
            context: 'Bargaining at the market',
            order: 3,
          },
          {
            yoruba: 'Mo fẹ́ ra èyí',
            pronunciation: 'Moh feh rah eh-yee',
            english: 'I want to buy this',
            context: 'Indicating interest in purchasing an item',
            order: 4,
          },
          {
            yoruba: 'Ẹ ṣé o',
            pronunciation: 'Eh sheh oh',
            english: 'Thank you',
            context: 'Expressing gratitude',
            order: 5,
          },
        ],
      },
    },
  });

  // Lesson 4: Numbers
  const lesson4 = await prisma.lesson.upsert({
    where: { id: 'lesson-numbers' },
    update: {},
    create: {
      id: 'lesson-numbers',
      title: 'Nọ́mbà - Numbers and Counting',
      description: 'Learn how to count and use numbers in Yoruba',
      category: 'vocabulary',
      difficulty: 'beginner',
      order: 4,
      phrases: {
        create: [
          {
            yoruba: 'Ení, Èjì, Ẹ̀ta',
            pronunciation: 'Eh-nee, Eh-jee, Eh-tah',
            english: 'One, Two, Three',
            context: 'Basic counting in Yoruba',
            order: 1,
          },
          {
            yoruba: 'Ẹ̀rin, Àrún, Ẹ̀fà',
            pronunciation: 'Eh-reen, Ah-roon, Eh-fah',
            english: 'Four, Five, Six',
            context: 'Continued counting',
            order: 2,
          },
          {
            yoruba: 'Èje, Ẹ̀jọ, Ẹ̀sán, Ẹ̀wá',
            pronunciation: 'Eh-jeh, Eh-jaw, Eh-sahn, Eh-wah',
            english: 'Seven, Eight, Nine, Ten',
            context: 'Complete basic numbers',
            order: 3,
          },
          {
            yoruba: 'Ogún',
            pronunciation: 'Oh-goon',
            english: 'Twenty',
            context: 'Yoruba counting uses a base-20 (vigesimal) system',
            order: 4,
          },
        ],
      },
    },
  });

  // Lesson 5: Asking for Directions
  const lesson5 = await prisma.lesson.upsert({
    where: { id: 'lesson-directions' },
    update: {},
    create: {
      id: 'lesson-directions',
      title: 'Ìtọ́sọ́nà - Asking for Directions',
      description: 'Learn how to ask for and give directions in Yoruba',
      category: 'conversation',
      difficulty: 'intermediate',
      order: 5,
      phrases: {
        create: [
          {
            yoruba: 'Ibo ni... wà?',
            pronunciation: 'Ee-boh nee... wah?',
            english: 'Where is...?',
            context: 'Asking where something is located',
            order: 1,
          },
          {
            yoruba: 'Lọ tààrà',
            pronunciation: 'Law tah-ah-rah',
            english: 'Go straight',
            context: 'Directing someone to go straight ahead',
            order: 2,
          },
          {
            yoruba: 'Yà sí ọ̀tún',
            pronunciation: 'Yah see aw-toon',
            english: 'Turn right',
            context: 'Directing someone to turn right',
            order: 3,
          },
          {
            yoruba: 'Yà sí òsì',
            pronunciation: 'Yah see aw-see',
            english: 'Turn left',
            context: 'Directing someone to turn left',
            order: 4,
          },
        ],
      },
    },
  });

  // Lesson 6: Family Members
  const lesson6 = await prisma.lesson.upsert({
    where: { id: 'lesson-family' },
    update: {},
    create: {
      id: 'lesson-family',
      title: 'Ẹbí - Family Members',
      description: 'Learn the words for family members in Yoruba',
      category: 'vocabulary',
      difficulty: 'beginner',
      order: 6,
      phrases: {
        create: [
          {
            yoruba: 'Bàbá',
            pronunciation: 'Bah-bah',
            english: 'Father',
            context: 'Also used as a respectful title for older men',
            order: 1,
          },
          {
            yoruba: 'Ìyá',
            pronunciation: 'Ee-yah',
            english: 'Mother',
            context: 'Also used as a respectful title for older women',
            order: 2,
          },
          {
            yoruba: 'Ọmọ',
            pronunciation: 'Aw-maw',
            english: 'Child',
            context: 'Can refer to son or daughter',
            order: 3,
          },
          {
            yoruba: 'Ẹ̀gbọ́n',
            pronunciation: 'Eh-gbawn',
            english: 'Older sibling',
            context: 'Used for elder brother or sister',
            order: 4,
          },
          {
            yoruba: 'Àbúrò',
            pronunciation: 'Ah-boo-raw',
            english: 'Younger sibling',
            context: 'Used for younger brother or sister',
            order: 5,
          },
        ],
      },
    },
  });

  // Lesson 7: Common Proverbs
  const lesson7 = await prisma.lesson.upsert({
    where: { id: 'lesson-proverbs' },
    update: {},
    create: {
      id: 'lesson-proverbs',
      title: 'Òwe - Yoruba Proverbs',
      description: 'Learn popular Yoruba proverbs and their meanings',
      category: 'grammar',
      difficulty: 'advanced',
      order: 7,
      phrases: {
        create: [
          {
            yoruba: 'Àgbà kì í wà lọ́jà, kí orí ọmọ títún wọ́',
            pronunciation: 'Ah-gbah kee ee wah law-jah, key oh-ree aw-maw tee-toon waw',
            english: 'An elder does not stay in the market and let a child's head go crooked',
            context: 'Proverb meaning elders have a duty to correct the young',
            order: 1,
          },
          {
            yoruba: 'Bí a bá ń lọ, a ń bọ̀',
            pronunciation: 'Bee ah bah n law, ah n baw',
            english: 'As we go, we also return',
            context: 'Proverb about the cyclical nature of life',
            order: 2,
          },
          {
            yoruba: 'Ọ̀rọ̀ tó bá yé ẹni, kò pọ̀',
            pronunciation: 'Aw-raw toe bah yeh eh-nee, kaw paw',
            english: 'Words that one understands are never too many',
            context: 'Proverb emphasizing the value of clear communication',
            order: 3,
          },
        ],
      },
    },
  });

  console.log('Created lessons:', { lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7 });

  // Create vocabulary - Greetings
  await prisma.vocabulary.create({
    data: {
      word: 'Ẹ kú',
      pronunciation: 'Eh koo',
      meaning: 'Greeting prefix (used before time of day)',
      type: 'greetings',
      examples: JSON.stringify(['Ẹ kú àárọ̀ - Good morning', 'Ẹ kú irọ́lẹ́ - Good evening']),
    },
  });

  await prisma.vocabulary.create({
    data: {
      word: 'Ó dàbọ̀',
      pronunciation: 'Aw dah-baw',
      meaning: 'Goodbye',
      type: 'greetings',
      examples: JSON.stringify(['Ó dàbọ̀, ẹ máa rìn dáadáa - Goodbye, have a safe trip']),
    },
  });

  await prisma.vocabulary.create({
    data: {
      word: 'Ẹ ṣé',
      pronunciation: 'Eh sheh',
      meaning: 'Thank you',
      type: 'greetings',
      examples: JSON.stringify(['Ẹ ṣé púpọ̀ - Thank you very much', 'Ẹ ṣé o - Thank you (informal)']),
    },
  });

  // Create vocabulary - Nouns
  await prisma.vocabulary.create({
    data: {
      word: 'Ilé',
      pronunciation: 'Ee-leh',
      meaning: 'House / Home',
      type: 'nouns',
      examples: JSON.stringify(['Mo ń lọ sí ilé - I am going home', 'Ilé ẹ̀kọ́ - School (house of learning)']),
    },
  });

  await prisma.vocabulary.create({
    data: {
      word: 'Omi',
      pronunciation: 'Oh-mee',
      meaning: 'Water',
      type: 'nouns',
      examples: JSON.stringify(['Fún mi ní omi - Give me water', 'Omi tútù - Cold water']),
    },
  });

  await prisma.vocabulary.create({
    data: {
      word: 'Oúnjẹ',
      pronunciation: 'Oh-oon-jeh',
      meaning: 'Food',
      type: 'nouns',
      examples: JSON.stringify(['Mo fẹ́ jẹ oúnjẹ - I want to eat food', 'Oúnjẹ yìí dùn - This food is delicious']),
    },
  });

  // Create vocabulary - Verbs
  await prisma.vocabulary.create({
    data: {
      word: 'Jẹ',
      pronunciation: 'Jeh',
      meaning: 'To eat',
      type: 'verbs',
      examples: JSON.stringify(['Mo ń jẹun - I am eating', 'Wá jẹun - Come and eat']),
    },
  });

  await prisma.vocabulary.create({
    data: {
      word: 'Lọ',
      pronunciation: 'Law',
      meaning: 'To go',
      type: 'verbs',
      examples: JSON.stringify(['Mo ń lọ - I am going', 'Ẹ jẹ́ kí á lọ - Let us go']),
    },
  });

  await prisma.vocabulary.create({
    data: {
      word: 'Wá',
      pronunciation: 'Wah',
      meaning: 'To come',
      type: 'verbs',
      examples: JSON.stringify(['Wá síbí - Come here', 'Mo ti wá - I have come']),
    },
  });

  // Create vocabulary - Proverbs
  await prisma.vocabulary.create({
    data: {
      word: 'Ọwọ́ kan kò gbé ẹrù d\'orí',
      pronunciation: 'Aw-waw kahn kaw gbeh eh-roo doh-ree',
      meaning: 'One hand cannot lift a load to the head (cooperation proverb)',
      type: 'proverbs',
      examples: JSON.stringify(['Used to encourage teamwork and cooperation']),
    },
  });

  console.log('Created vocabulary entries');

  // Create daily goal for demo user
  const dailyGoal = await prisma.dailyGoal.create({
    data: {
      userId: demoUser.id,
      date: new Date(),
      targetMinutes: 15,
      completedMinutes: 10,
      targetLessons: 3,
      completedLessons: 1,
    },
  });

  console.log('Created daily goal:', dailyGoal);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
