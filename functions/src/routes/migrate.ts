import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';

const router = Router();

// POST /api/migrate/patch-data — one-time migration to add missing data
// This endpoint is idempotent — safe to call multiple times
router.post('/patch-data', async (req: Request, res: Response) => {
  const results: Record<string, string> = {};

  try {
    // ─── 1. Chain lessons with prerequisiteId ──────────────────────────────
    const lessonsSnap = await db.collection('lessons').orderBy('order', 'asc').get();
    let prevId: string | null = null;
    let lessonUpdates = 0;
    for (const doc of lessonsSnap.docs) {
      const data = doc.data();
      if (data.prerequisiteId === undefined) {
        await doc.ref.update({
          prerequisiteId: prevId,
          minimumScoreToUnlock: 70,
        });
        lessonUpdates++;
      }
      prevId = doc.id;
    }
    results.lessons = `${lessonUpdates} lessons updated with prerequisiteId`;

    // ─── 2. Seed reading exercises if empty ────────────────────────────────
    const readingCount = (await db.collection('readingExercises').count().get()).data().count;
    if (readingCount === 0) {
      const readingExercises = [
        {
          title: 'Ìkíni Ojoojúmọ́ — Daily Greetings',
          difficulty: 'beginner',
          passage: `Owúrọ̀ ọjọ́ kan, Adébáyọ̀ wọ ilé iṣẹ́ rẹ̀. Ó kí àwọn alábàáṣiṣẹ́pọ̀ rẹ̀.\n\n"Ẹ kú àárọ̀!" Adébáyọ̀ kí Títílayọ́.\n"Ẹ kú àárọ̀, o! Báwo ni?" Títílayọ́ dáhùn.\n"Mo wà dáadáa, ẹ ṣé. Ṣé àlàáfíà ni?" Adébáyọ̀ béèrè.\n"Àlàáfíà, ọ̀rẹ́ mi. Ẹ kú iṣẹ́ o!" Títílayọ́ sọ.\n\nNígbà tí ó di ọ̀sán, Adébáyọ̀ lọ sí ilé oúnjẹ. Ó pàdé Kúnlé níbẹ̀.\n"Ẹ kú ọ̀sán, Kúnlé!" Adébáyọ̀ kí i.\n"Ẹ kú ọ̀sán! Ṣé o ti jẹun?" Kúnlé béèrè.\n"Rárá, èmi ò tíì jẹun. Ẹ jẹ́ ká jẹun papọ̀," Adébáyọ̀ dáhùn.`,
          questions: [
            { id: 'q1', question: 'Where did Adébáyọ̀ go in the morning?', options: ['To the market', 'To his workplace', 'To school', 'To church'], correct: 'To his workplace' },
            { id: 'q2', question: 'What does "Mo wà dáadáa" mean?', options: ['I am tired', 'I am fine', 'I am hungry', 'I am late'], correct: 'I am fine' },
            { id: 'q3', question: 'Who did Adébáyọ̀ meet at the restaurant?', options: ['Títílayọ́', 'Kúnlé', 'His boss', 'His wife'], correct: 'Kúnlé' },
            { id: 'q4', question: 'What does "Ṣé o ti jẹun?" mean?', options: ['Are you leaving?', 'Have you eaten?', 'Are you working?', 'Are you sleeping?'], correct: 'Have you eaten?' },
          ],
        },
        {
          title: 'Ọjà Ẹ̀kọ́ — Lagos Market',
          difficulty: 'beginner',
          passage: `Àìní lọ sí ọjà ní ọjọ́ Abámẹ́ta. Ó fẹ́ ra oúnjẹ fún ẹbí rẹ̀.\n\n"Ẹ kú ọjà, ìyá tó ń tajà!" Àìní kí aláǹtà kan.\n"Ẹ kú àbọ̀, ọmọ mi. Kí ni o fẹ́ rà?" aláǹtà béèrè.\n"Mo fẹ́ rà ọ̀gẹ̀dẹ̀, àgbàdo, àti tómátì," Àìní dáhùn.\n"Ọ̀gẹ̀dẹ̀ jẹ́ ọgọ́rùn-ún náírà, àgbàdo jẹ́ ẹ̀ẹ́dẹ́gbẹ̀ta náírà," aláǹtà sọ.\n"Ó pọ̀ jù! Ẹ dín wọn kù fún mi," Àìní béèrè.\n"Ó dáa, ẹgbẹ̀rún náírà fún gbogbo rẹ̀," aláǹtà gbà.\n"Ó ṣeun, ìyá mi. Ọlọ́run a ń gbé yín o!" Àìní sọ.`,
          questions: [
            { id: 'q1', question: 'What day did Àìní go to the market?', options: ['Monday', 'Wednesday', 'Friday', 'Saturday'], correct: 'Wednesday' },
            { id: 'q2', question: 'What did Àìní want to buy?', options: ['Rice and beans', 'Plantain, corn, and tomatoes', 'Yam and fish', 'Bread and butter'], correct: 'Plantain, corn, and tomatoes' },
            { id: 'q3', question: 'What does "Ó pọ̀ jù" mean?', options: ['It is cheap', 'It is too much/expensive', 'It is perfect', 'It is small'], correct: 'It is too much/expensive' },
            { id: 'q4', question: 'What happened in the end?', options: ['Àìní left without buying', 'The price was reduced', 'Àìní got angry', 'The seller refused'], correct: 'The price was reduced' },
          ],
        },
        {
          title: 'Ìdílé Mi — My Family',
          difficulty: 'beginner',
          passage: `Orúkọ mi ni Folúṣọ́. Mo ní ẹbí ńlá. Bàbá mi jẹ́ olùkọ́ ní ilé ẹ̀kọ́ gíga. Màmá mi jẹ́ oníṣòwò — ó ń ta aṣọ ní ọjà.\n\nMo ní arákùnrin méjì àti arábìnrin kan. Arákùnrin mi àgbà orúkọ rẹ̀ ni Adéwálé — ó jẹ́ dókítà. Arákùnrin mi àbúrò orúkọ rẹ̀ ni Olúwáséun — ó ṣì ń kàwé ní yunifásítì.\n\nArábìnrin mi orúkọ rẹ̀ ni Bùkọ́lá. Ó ti gbéyàwó. Ọkọ rẹ̀ orúkọ rẹ̀ ni Tóyìn. Wọ́n ní ọmọ méjì — ọmọkùnrin kan àti ọmọbìnrin kan.\n\nẸbí wa máa ń jọ pàdé ní ọjọ́ Àìkú, a máa ń jẹ oúnjẹ papọ̀, a sì máa ń bá ara wa sọ̀rọ̀.`,
          questions: [
            { id: 'q1', question: 'What does Folúṣọ́\'s father do?', options: ['He is a doctor', 'He is a teacher', 'He is a trader', 'He is a farmer'], correct: 'He is a teacher' },
            { id: 'q2', question: 'How many siblings does Folúṣọ́ have?', options: ['One', 'Two', 'Three', 'Four'], correct: 'Three' },
            { id: 'q3', question: 'What does Adéwálé do for a living?', options: ['Student', 'Teacher', 'Doctor', 'Trader'], correct: 'Doctor' },
            { id: 'q4', question: 'When does the family meet together?', options: ['On Mondays', 'On Sundays', 'On Saturdays', 'Every day'], correct: 'On Sundays' },
            { id: 'q5', question: 'How many children does Bùkọ́lá have?', options: ['One', 'Two', 'Three', 'None'], correct: 'Two' },
          ],
        },
        {
          title: 'Ìrìn Àjò — A Journey',
          difficulty: 'intermediate',
          passage: `Ní ọjọ́ kan, Dàmọ́lá gbéra láti Lagos lọ sí Ibadan. Ó gún ọkọ̀ akérò ní Ojòtá. Ọkọ̀ náà kún fún ènìyàn.\n\n"Ẹ jọ̀wọ́, ṣé ibùjókòó tí wà?" Dàmọ́lá béèrè lọ́wọ́ agbẹ̀nusọ.\n"Bẹ́ẹ̀ni, ibùjókòó kan ṣì wà ní ẹ̀yìn," agbẹ̀nusọ dáhùn.\n\nÓ jókòó, ó sì ti fọ́nù rẹ̀ jáde láti gbọ́ orin. Nígbà tí wọ́n ti rìn fún wákàtí kan, ọkọ̀ dúró nítorí tí ọ̀nà bajẹ́.\n\n"Gbogbo ènìyàn ẹ sùúrù, àwa yóò gbìyànjú láti ṣàtúnṣe," aṣaọkọ̀ sọ.\n\nLẹ́yìn ìdákẹ́jẹ́ wákàtí méjì, wọ́n tún bẹ̀rẹ̀ ìrìn àjò. Dàmọ́lá dé Ibadan ní aṣálẹ́ — ó pẹ́ sùgbọ́n ó dé.`,
          questions: [
            { id: 'q1', question: 'Where was Dàmọ́lá travelling from?', options: ['Ibadan', 'Abuja', 'Lagos', 'Kano'], correct: 'Lagos' },
            { id: 'q2', question: 'What happened during the journey?', options: ['The bus ran out of fuel', 'The road was bad/damaged', 'There was an accident', 'It started raining'], correct: 'The road was bad/damaged' },
            { id: 'q3', question: 'How long was the delay?', options: ['30 minutes', '1 hour', '2 hours', '3 hours'], correct: '2 hours' },
            { id: 'q4', question: 'What does "Ẹ sùúrù" mean?', options: ['Be careful', 'Be patient', 'Be quiet', 'Be fast'], correct: 'Be patient' },
          ],
        },
        {
          title: 'Ilé Ìwòsàn — At the Hospital',
          difficulty: 'intermediate',
          passage: `Àbíọ́dún kò rí ara dáadáa ní ọjọ́ méta. Orí rẹ̀ ń fọ́, ara rẹ̀ sì gbóná. Ó pinnu láti lọ sí ilé ìwòsàn.\n\nNígbà tí ó dé, nọ́ọ̀sì kan pàdé rẹ̀.\n"Ẹ kú àbọ̀. Kí ni ó ń ṣe yín?" nọ́ọ̀sì béèrè.\n"Orí mi ń fọ́, ara mi sì gbóná. Mo ti ń ṣàìsàn fún ọjọ́ méta," Àbíọ́dún dáhùn.\n"Ẹ jọ̀wọ́ ẹ jókòó, dókítà yóò pe yín láìpẹ́," nọ́ọ̀sì sọ.\n\nDókítà Ọlámídé ṣàyẹ̀wò rẹ̀: "Ìgbóná ara yín ga. Ẹ ní ibà. Mo máa fún yín ní oògùn. Ẹ mu oògùn lẹ́mẹta lójúmọ́, ẹ sì mu omi púpọ̀."\n\n"Ẹ ṣé, dókítà. Ìgbà mélòó ni kí n padà wá?" Àbíọ́dún béèrè.\n"Ẹ padà wá ní ọjọ́ márùn-ún tí ẹ bá ṣì rí ara yín," dókítà dáhùn.`,
          questions: [
            { id: 'q1', question: 'How long had Àbíọ́dún been ill?', options: ['One day', 'Two days', 'Three days', 'A week'], correct: 'Three days' },
            { id: 'q2', question: 'What were Àbíọ́dún\'s symptoms?', options: ['Cough and cold', 'Headache and fever', 'Stomach ache', 'Leg pain'], correct: 'Headache and fever' },
            { id: 'q3', question: 'What was the diagnosis?', options: ['Malaria/fever', 'Cold', 'Typhoid', 'COVID'], correct: 'Malaria/fever' },
            { id: 'q4', question: 'How often should the medicine be taken?', options: ['Once a day', 'Twice a day', 'Three times a day', 'Four times a day'], correct: 'Three times a day' },
            { id: 'q5', question: 'When should Àbíọ́dún return?', options: ['In 3 days', 'In 5 days', 'In a week', 'In 2 weeks'], correct: 'In 5 days' },
          ],
        },
        {
          title: 'Ìtàn Kékeré — A Short Yoruba Tale',
          difficulty: 'intermediate',
          passage: `Ní ìgbà àtijọ́, ìjàpá àti ehoro jẹ́ ọ̀rẹ́. Ọjọ́ kan, wọ́n rí igi ọ̀pẹ kan tí ó kún fún èso.\n\n"Ìjàpá, jẹ́ ká gun igi yìí ká sì jẹ èso rẹ̀," ehoro sọ.\n"Ó dáa, ṣùgbọ́n èmi ò lè gun igi," ìjàpá dáhùn. "Ṣùgbọ́n mo ní ètò kan."\n\nÌjàpá sọ fún ehoro pé kí ó gun igi náà kí ó sì jù èso sókè sí oun. Ehoro ko mọ̀ pé ìjàpá ń tan ọ́n jẹ.\n\nEhoro gun igi, ó sì bẹ̀rẹ̀ sí jù èso sílẹ̀. Ṣùgbọ́n ìjàpá kò jù kankan sókè fún ehoro — ó ń jẹ gbogbo rẹ̀ fún ara rẹ̀!\n\n"Ìjàpá, kí ni o ń ṣe?" ehoro kígbe.\n"Mo ń jẹ ohun tí mo nífẹ̀ẹ́ sí," ìjàpá dáhùn pẹ̀lú ẹ̀rín.\n\nÈyí ni ìdí tí àwọn àgbà fi máa ń sọ pé: "Ìjàpá ológbón-ín jù, ó fi ẹ̀tàn jẹ ayé."`,
          questions: [
            { id: 'q1', question: 'Who are the two characters in the story?', options: ['Tortoise and rabbit', 'Lion and monkey', 'Dog and cat', 'Spider and ant'], correct: 'Tortoise and rabbit' },
            { id: 'q2', question: 'What did they find?', options: ['A river', 'A palm tree with fruits', 'A house', 'Gold'], correct: 'A palm tree with fruits' },
            { id: 'q3', question: 'Why couldn\'t Ìjàpá (tortoise) climb?', options: ['He was lazy', 'He can\'t climb trees', 'He was scared', 'He was injured'], correct: 'He can\'t climb trees' },
            { id: 'q4', question: 'What did Ìjàpá do with the fruits?', options: ['Shared equally', 'Ate them all himself', 'Threw them away', 'Saved for later'], correct: 'Ate them all himself' },
          ],
        },
        {
          title: 'Ọ̀rọ̀ Ìṣòwò — Business Conversation',
          difficulty: 'advanced',
          passage: `Olúmídé jẹ́ oníṣòwò aṣọ ní Ọjà Balogun, Eko. Ó ti ń ṣòwò fún ọdún mẹ́wàá. Lónìí, ó ń bá alábàárà tuntun sọ̀rọ̀.\n\n"Ẹ káàbọ̀ sí Ọjà Balogun. Kí ni ẹ ń wá?" Olúmídé béèrè.\n"Mo fẹ́ ra aṣọ àdìrẹ̀ fún àjọyọ̀ kan. Mélòó ni ẹgbẹ̀ kan?" alábàárà béèrè.\n"Àdìrẹ̀ ọ̀hún jẹ́ ẹgbẹ̀rún mẹ́ẹ̀ẹ́dógún náírà. Kí ẹ ṣàìsànwó o, ọjà yìí jẹ́ ti àkọ́kọ́," Olúmídé sọ.\n\n"Ẹ̀ẹ̀, ó wọn jù! Ẹ dín wọn kù. N ó fi ẹgbẹ̀rún mẹ́wàá ra," alábàárà dáhùn.\n"Rárá o, ẹ ò lè dín bẹ́ẹ̀. Ẹ fi ẹgbẹ̀rún méjìlá, èyí ni tí ó kéhìn," Olúmídé gbà.\n"Ó dáa, ẹgbẹ̀rún méjìlá. Mo gbà," alábàárà fọwọ́ sí.\n\nOlúmídé wé aṣọ náà, ó sì fi sínú àpò. "Ẹ ṣé fún ọjà yín. Ẹ padà wá o!"`,
          questions: [
            { id: 'q1', question: 'Where is Olúmídé\'s shop?', options: ['Ọjà Oshodi', 'Ọjà Balogun', 'Ọjà Ìdùmọ̀ta', 'Ọjà Ọjó'], correct: 'Ọjà Balogun' },
            { id: 'q2', question: 'How long has Olúmídé been in business?', options: ['5 years', '8 years', '10 years', '15 years'], correct: '10 years' },
            { id: 'q3', question: 'What was the original asking price?', options: ['₦10,000', '₦12,000', '₦15,000', '₦20,000'], correct: '₦15,000' },
            { id: 'q4', question: 'What was the final agreed price?', options: ['₦10,000', '₦12,000', '₦13,000', '₦15,000'], correct: '₦12,000' },
          ],
        },
        {
          title: 'Àṣà Ọmọ Yorùbá — Yoruba Cultural Practices',
          difficulty: 'advanced',
          passage: `Àwọn Yorùbá ní àṣà púpọ̀ tí wọ́n fi ń ṣe ìyàtọ̀ sí àwọn ẹ̀yà mìíràn. Ọ̀kan lára àṣà pàtàkì ni ìjúbà — ọ̀nà tí àwọn ọmọ Yorùbá fi ń tẹrí ba àwọn àgbà.\n\nỌmọkùnrin a máa dá ọbálẹ̀ — ó máa dùbúlẹ̀ rí ìpẹ̀nlẹ̀ sí àwọn àgbà. Ọmọbìnrin a máa kúnlẹ̀ — ó máa fi ẽ̀ẹ̀kún méjèèjì kàn ilẹ̀. Èyí fi hàn pé wọ́n bọ̀wọ̀ fún àwọn àgbà.\n\nÀṣà mìíràn ni ọ̀nà tí wọ́n fi ń fún àgbà ní nǹkan. Wọ́n máa ń fi ọwọ́ ọ̀tún fún àgbà ní ohun, tàbí ọwọ́ méjèèjì. Kò yẹ kí ọmọ fi ọwọ́ òsì fún àgbà — kò dára.\n\nÀwọn orúkọ Yorùbá pàá ní ìtumọ̀ jíjinlẹ̀. Fún àpẹẹrẹ: "Adébáyọ̀" túmọ̀ sí "adé dé ní ìbáyọ̀" — ọba tuntun wá nínú ayọ̀. "Olúwáṣẹun" túmọ̀ sí "Ọlọ́run ṣe ohun yìí" — Ọlọ́run ṣe é. Orúkọ kọ̀ọ̀kan ní ìtàn àrà ọ̀tọ̀.`,
          questions: [
            { id: 'q1', question: 'What is "ìjúbà"?', options: ['A type of food', 'A way of greeting/showing respect to elders', 'A festival', 'A dance'], correct: 'A way of greeting/showing respect to elders' },
            { id: 'q2', question: 'How do boys prostrate to elders?', options: ['They kneel', 'They lie flat on the ground', 'They bow their head', 'They wave'], correct: 'They lie flat on the ground' },
            { id: 'q3', question: 'Which hand should be used to give something to an elder?', options: ['Left hand', 'Right hand or both hands', 'Any hand', 'It doesn\'t matter'], correct: 'Right hand or both hands' },
            { id: 'q4', question: 'What does "Adébáyọ̀" mean?', options: ['God is great', 'The crown came with joy', 'The child of prayer', 'Born on a special day'], correct: 'The crown came with joy' },
          ],
        },
      ];

      for (const exercise of readingExercises) {
        await db.collection('readingExercises').doc().set({
          ...exercise,
          createdAt: new Date().toISOString(),
        });
      }
      results.reading = `${readingExercises.length} reading exercises created`;
    } else {
      results.reading = `Already has ${readingCount} exercises, skipped`;
    }

    // ─── 3. Seed missions if empty ─────────────────────────────────────────
    const missionsCount = (await db.collection('missions').count().get()).data().count;
    if (missionsCount === 0) {
      const missionDefs = [
        { type: 'daily', title: 'Complete 1 lesson', description: 'Finish any lesson today', criteria: { action: 'complete_lesson', target: 1 }, reward: { xp: 50 } },
        { type: 'daily', title: 'Review 10 flashcards', description: 'Review 10 vocabulary flashcards', criteria: { action: 'review_flashcard', target: 10 }, reward: { xp: 30 } },
        { type: 'daily', title: 'Take a quiz', description: 'Complete any quiz', criteria: { action: 'complete_quiz', target: 1 }, reward: { xp: 40 } },
        { type: 'daily', title: 'Writing practice', description: 'Submit a writing exercise', criteria: { action: 'complete_writing', target: 1 }, reward: { xp: 35 } },
        { type: 'weekly', title: 'Complete 5 lessons', description: 'Finish 5 lessons this week', criteria: { action: 'complete_lesson', target: 5 }, reward: { xp: 150 } },
        { type: 'weekly', title: 'Conversation practice', description: 'Have 3 AI conversation sessions this week', criteria: { action: 'complete_conversation', target: 3 }, reward: { xp: 100 } },
        { type: 'weekly', title: 'Reading comprehension', description: 'Complete 2 reading exercises this week', criteria: { action: 'complete_reading', target: 2 }, reward: { xp: 80 } },
        { type: 'milestone', title: 'First steps', description: 'Complete your first lesson', criteria: { action: 'complete_lesson', target: 1 }, reward: { xp: 100, badge: '🌱' } },
        { type: 'milestone', title: 'Word collector', description: 'Review 100 flashcards', criteria: { action: 'review_flashcard', target: 100 }, reward: { xp: 200, badge: '📚' } },
        { type: 'milestone', title: 'Quiz master', description: 'Complete 10 quizzes', criteria: { action: 'complete_quiz', target: 10 }, reward: { xp: 250, badge: '🧠' } },
        { type: 'milestone', title: '7-day streak', description: 'Maintain a 7-day learning streak', criteria: { action: 'streak', target: 7 }, reward: { xp: 300, badge: '🔥' } },
        { type: 'milestone', title: 'Conversationalist', description: 'Complete 5 AI conversation sessions', criteria: { action: 'complete_conversation', target: 5 }, reward: { xp: 200, badge: '💬' } },
      ];
      for (const mission of missionDefs) {
        await db.collection('missions').doc().set({ ...mission, createdAt: new Date().toISOString() });
      }
      results.missions = `${missionDefs.length} missions created`;
    } else {
      results.missions = `Already has ${missionsCount} missions, skipped`;
    }

    // ─── 4. Seed achievements if empty ─────────────────────────────────────
    const achCount = (await db.collection('achievements').count().get()).data().count;
    if (achCount === 0) {
      const achievementDefs = [
        { title: 'First Lesson', description: 'Complete your first lesson', trigger: 'lessons_completed', threshold: 1, icon: '🌱' },
        { title: 'Dedicated Learner', description: 'Complete 10 lessons', trigger: 'lessons_completed', threshold: 10, icon: '📖' },
        { title: 'Scholar', description: 'Complete 25 lessons', trigger: 'lessons_completed', threshold: 25, icon: '🎓' },
        { title: 'Master', description: 'Complete all 60 lessons', trigger: 'lessons_completed', threshold: 60, icon: '👑' },
        { title: 'Perfect Score', description: 'Score 100% on a quiz', trigger: 'perfect_quiz', threshold: 1, icon: '💯' },
        { title: 'Quiz Enthusiast', description: 'Complete 10 quizzes', trigger: 'quizzes_completed', threshold: 10, icon: '📝' },
        { title: 'Streak Starter', description: 'Achieve a 3-day streak', trigger: 'streak', threshold: 3, icon: '🔥' },
        { title: 'Week Warrior', description: 'Achieve a 7-day streak', trigger: 'streak', threshold: 7, icon: '⚡' },
        { title: 'Month Champion', description: 'Achieve a 30-day streak', trigger: 'streak', threshold: 30, icon: '🏆' },
        { title: 'Bookworm', description: 'Complete 5 reading exercises', trigger: 'readings_completed', threshold: 5, icon: '📚' },
        { title: 'Wordsmith', description: 'Submit 5 writing exercises', trigger: 'writings_completed', threshold: 5, icon: '✍️' },
        { title: 'Conversationalist', description: 'Complete 5 AI conversations', trigger: 'conversations_completed', threshold: 5, icon: '💬' },
        { title: 'Vocab Builder', description: 'Review 50 flashcards', trigger: 'flashcards_reviewed', threshold: 50, icon: '🃏' },
        { title: 'Vocab Master', description: 'Review 500 flashcards', trigger: 'flashcards_reviewed', threshold: 500, icon: '🏅' },
        { title: 'Rising Star', description: 'Reach Level 5', trigger: 'level', threshold: 5, icon: '⭐' },
        { title: 'XP Hunter', description: 'Earn 5000 XP total', trigger: 'total_xp', threshold: 5000, icon: '🎯' },
      ];
      for (const ach of achievementDefs) {
        await db.collection('achievements').doc().set({ ...ach, createdAt: new Date().toISOString() });
      }
      results.achievements = `${achievementDefs.length} achievements created`;
    } else {
      results.achievements = `Already has ${achCount} achievements, skipped`;
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', detail: error?.message });
  }
});

export default router;
