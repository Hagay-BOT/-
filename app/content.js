/* All text content. Each claim carries its sources. Dosages follow the plan from the
   "מאמן" project conversation, with the ranges the sources give shown next to them. */
(function (global) {
  'use strict';
  const S = {
    southTeesDNF: ['South Tees NHS – Deep neck flexion in supine', 'https://www.southtees.nhs.uk/resources/deep-neck-flexion-in-supine/'],
    physioDNF: ['Physiopedia – Deep Neck Flexor Stabilisation Protocol', 'https://www.physio-pedia.com/Deep_Neck_Flexor_Stabilisation_Protocol'],
    physioDNFm: ['Physiopedia – Cervical Deep Neck Flexors', 'https://www.physio-pedia.com/Cervical_Deep_Neck_Flexors'],
    cuhNeck: ['Cambridge University Hospitals NHS – Neck exercises and advice', 'https://www.cuh.nhs.uk/patient-information/neck-exercises-and-advice/'],
    mayoRow: ['Mayo Clinic – Seated row with resistance tubing', 'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/seated-row/vid-20084669'],
    aceRow: ['ACE – Seated Row', 'https://www.acefitness.org/resources/everyone/exercise-library/168/seated-row/'],
    aceCues: ['ACE – Correct cues for scapular motion', 'https://www.acefitness.org/certifiednewsarticle/2384/correct-cues-for-scapular-motion/'],
    harvardDB: ['Harvard Health – The many benefits of the dead bug', 'https://www.health.harvard.edu/exercise-and-fitness/the-many-benefits-of-the-dead-bug'],
    aceDB: ['ACE – Supine Dead Bug', 'https://www.acefitness.org/resources/everyone/exercise-library/147/supine-dead-bug/'],
    nasmDB: ['NASM – Dead Bug', 'https://www.nasm.org/resource-center/exercise-library/dead-bug'],
    harvardBD: ['Harvard Health – Bird dog exercise: how to do it safely', 'https://www.health.harvard.edu/exercise-and-fitness/bird-dog-exercise-for-your-core-how-to-do-it-safely'],
    aceBD: ['ACE – Bird Dog', 'https://www.acefitness.org/resources/everyone/exercise-library/14/bird-dog/'],
    mcgill: ['ACE – Low back exercises: Stuart McGill’s Big Three', 'https://www.acefitness.org/resources/pros/expert-articles/7077/low-back-exercises-stuart-mcgill-s-big-three/'],
    aceSP: ['ACE – Side Plank (modified)', 'https://www.acefitness.org/resources/everyone/exercise-library/100/side-plank-modified/'],
    nasmSP: ['NASM – Side Plank', 'https://www.nasm.org/resource-center/exercise-library/side-plank'],
    aceBr: ['ACE – Glute Bridge', 'https://www.acefitness.org/resources/everyone/exercise-library/49/glute-bridge/'],
    ccBr: ['Cleveland Clinic – Glute bridges', 'https://health.clevelandclinic.org/glute-bridges'],
    mayoBack: ['Mayo Clinic – Back exercises in 15 minutes a day', 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/back-pain/art-20546859'],
    rohKnee: ['Royal Orthopaedic Hospital NHS – Exercises for osteoarthritis of the knee', 'https://roh.nhs.uk/services-information/therapy/exercises-for-osteoarthritis-of-the-knee'],
    nasmClam: ['NASM – The banded clamshell', 'https://www.nasm.org/resource-center/blog/training/the-banded-clamshell-a-simple-move-for-stronger-glutes'],
    selkowitz: ['Selkowitz et al., JOSPT 2013 – EMG of gluteal exercises', 'https://www.jospt.org/doi/10.2519/jospt.2013.4116'],
    wigan: ['Wrightington, Wigan & Leigh NHS – Hip exercises level 1', 'https://www.wwl.nhs.uk/media/.leaflets/65782f3d32ba36.26336801.pdf'],
    rbKnee: ['Royal Berkshire NHS – Anterior knee pain', 'https://www.royalberkshire.nhs.uk/media/scablcbl/anterior-knee-pain_mar26.pdf'],
    mayoStretch: ['Mayo Clinic – Stretching: focus on flexibility', 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/stretching/art-20047931'],
    stHam: ['South Tees NHS – Hamstring stretch', 'https://www.southtees.nhs.uk/resources/hamstring-stretch-1/'],
    aceHam: ['ACE – Supine hamstrings stretch', 'https://www.acefitness.org/education-and-resources/lifestyle/exercise-library/235/supine-hamstrings-stretch/'],
    rohCalf: ['Royal Orthopaedic Hospital NHS – Calf stretching', 'https://roh.nhs.uk/services-information/foot-and-ankle/calf-stretching'],
    ccCat: ['Cleveland Clinic – Cat-cow stretch', 'https://health.clevelandclinic.org/cat-cow-stretch'],
    frimley: ['Frimley Health NHS – Head, neck and shoulder stretches', 'https://www.fhft.nhs.uk/patients-and-visitors/patient-information-library/head-neck-and-shoulder-stretches'],
    mayoScap: ['Mayo Clinic – Shoulder blade squeeze', 'https://www.mayoclinic.org/img-20076263'],
    acsm2011: ['ACSM Position Stand, Garber et al. 2011 (Med Sci Sports Exerc)', 'https://journals.lww.com/acsm-msse/fulltext/2011/07000/quantity_and_quality_of_exercise_for_developing.26.aspx'],
    acsmRT: ['ACSM – Resistance training guidance', 'https://acsm.org/effective-resistance-training-program-infographic/'],
    aaosSF: ['AAOS OrthoInfo – Stress fractures', 'https://orthoinfo.aaos.org/en/diseases--conditions/stress-fractures/'],
    aafp24: ['AAFP 2024 – Bone stress injuries: diagnosis and management', 'https://www.aafp.org/pubs/afp/issues/2024/1200/bone-stress-injuries.html'],
    wood: ['Wood et al. 2014 – Stress fractures in Royal Marines training', 'https://pubmed.ncbi.nlm.nih.gov/26464890/'],
    hoenig: ['Hoenig et al., BJSM 2023 – Return to sport after bone stress injuries (meta-analysis)', 'https://www.researchgate.net/publication/367662462'],
    highRisk: ['High-risk stress fractures (review, PubMed)', 'https://pubmed.ncbi.nlm.nih.gov/26972260/'],
    blackLine: ['"Dreaded black line" – J Belg Soc Radiol', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10487173/'],
    warden: ['Warden et al., JOSPT 2021 – Optimal load for low-risk tibial and metatarsal BSIs', 'https://www.jospt.org/doi/10.2519/jospt.2021.9982'],
    george: ['George et al., Sports Med 2024 – Returning to running after tibial BSI', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11393297/'],
    buist: ['Buist et al. 2008 – RCT of a graded (10%) running program', 'https://research.rug.nl/en/publications/no-effect-of-a-graded-training-program-on-the-number-of-running-r/'],
    milgrom21: ['Milgrom et al. 2021 – IDF medial tibial stress fracture guidelines', 'https://pubmed.ncbi.nlm.nih.gov/33298373/'],
    milgrom85: ['Milgrom et al. 1985 – Stress fractures in Israeli infantry recruits', 'https://boneandjoint.org.uk/Article/10.1302/0301-620X.67B5.4055871'],
    lappe: ['Lappe et al. 2008 – Calcium & vitamin D in Navy recruits (RCT)', 'https://pubmed.ncbi.nlm.nih.gov/18433305/'],
    dxa: ['Stress fracture in athletes: a practical approach (review)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13117385/'],
    walsh: ['Walsh & Low 2021 – Military load carriage review', 'https://radar.brookes.ac.uk/radar/file/48e81c11-9b2d-4b2c-ac64-f32100d482c8/1/Military%20load%20carriage%20-%202021%20-%20Walsh%20Low.pdf'],
    knapik: ['Knapik, Reynolds & Harman 2004 – Soldier load carriage (Mil Med)', 'https://pubmed.ncbi.nlm.nih.gov/14964502/'],
    lafiandra: ['LaFiandra & Harman 2004 – Force distribution during load carriage', 'https://www.researchgate.net/publication/8625280'],
    schwameder: ['Schwameder et al. 1999 – Knee joint forces with walking poles', 'https://pubmed.ncbi.nlm.nih.gov/10622357/'],
    bohne: ['Bohne & Abendroth-Smith 2007 – Trekking poles in downhill hiking', 'https://pubmed.ncbi.nlm.nih.gov/17218900/'],
    nice: ['NICE NG59 – Low back pain and sciatica in over 16s', 'https://www.nice.org.uk/guidance/ng59/chapter/Recommendations'],
    acp: ['ACP 2017 guideline – Noninvasive treatments for low back pain', 'https://pubmed.ncbi.nlm.nih.gov/28192789/'],
    jospt21: ['JOSPT 2021 – Low back pain clinical practice guideline', 'https://pubmed.ncbi.nlm.nih.gov/34719942/'],
    jospt17: ['JOSPT 2017 – Neck pain clinical practice guideline', 'https://www.jospt.org/doi/10.2519/jospt.2017.0302'],
    cochraneEx: ['Hayden et al., Cochrane 2021 – Exercise therapy for chronic low back pain', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8477273'],
    cochraneHeat: ['French et al., Cochrane – Superficial heat or cold for low back pain', 'https://digital.library.adelaide.edu.au/items/7115b07d-a142-4ca4-92c0-7aea0c98da7f'],
    nhsDisc: ['NHS – Slipped disc', 'https://www.nhs.uk/conditions/slipped-disc/'],
    aaosDisc: ['AAOS OrthoInfo – Herniated disk in the lower back', 'https://orthoinfo.aaos.org/en/diseases--conditions/herniated-disk-in-the-lower-back/'],
    aerzte: ['Deutsches Ärzteblatt 2024 – Lumbar disc herniation and symptom duration', 'https://pubmed.ncbi.nlm.nih.gov/38835174/'],
    acpImg: ['AAFP summary of ACP imaging guidance', 'https://www.aafp.org/pubs/afp/issues/2008/0601/p1607.html'],
    ces1: ['Royal Free London NHS – Cauda equina syndrome', 'https://royalfree.nhs.uk/patients-and-visitors/patient-information-leaflets/cauda-equina-syndrome'],
    ces2: ['GIRFT / CSP – National suspected cauda equina pathway', 'https://www.csp.org.uk/journal/article/physiotherapy-journal-march-2024/national-suspected-cauda-equina-syndrome-pathway'],
    dcm: ['Leeds Community Healthcare NHS – Degenerative cervical myelopathy', 'https://leedscommunityhealthcare.nhs.uk/our-services-a-z/musculoskeletal-msk/neck-problems/known-and-diagnosed-neck-problems/degenerative-cervical-myelopathy/'],
    bedrest: ['Dudley Group NHS – Acute low back pain', 'https://www.dgft.nhs.uk/pil/acute-low-back-pain/'],
    mod: ['משרד הביטחון – אגף השיקום', 'https://mod.gov.il/en/departments/rehabilitation-department'],
    chat: ['השיחה בפרויקט "מאמן"', '']
  };

  const ex = {
    chin: {
      name: 'הכנסת סנטר בשכיבה', en: 'Supine chin tuck · deep neck flexors', move: 'chin',
      dose: { sets: 1, reps: 10, hold: 5, relax: 4 }, doseText: '10 × החזקה 5 שנ׳',
      purpose: 'מאמן את שרירי הצוואר העמוקים (longus colli ו-longus capitis). המטרה כאן היא דיוק, לא כוח.',
      start: 'שוכבים על הגב, ברכיים כפופות, כפות רגליים על הרצפה. מגבת מקופלת מתחת לראש, מבט לתקרה.',
      steps: ['משחררים את הפה והלסת.', 'מהנהנים בעדינות "כן": הסנטר מתקרב פנימה, העורף מתארך.', 'העורף נשאר כל הזמן על המגבת. לא מרימים את הראש ולא לוחצים אותו למטה.', 'מחזיקים עד 5 שניות ומשחררים לאט.'],
      breath: 'נושמים רגיל. לא עוצרים את הנשימה ולא מכווצים כתפיים.',
      mistakes: ['להרים את הראש מהמגבת.', 'לדחוף את הראש למטה אל המגבת במקום להנהן.', 'תנועה מהירה וחדה של הסנטר.', 'לכווץ את השרירים הבולטים בקדמת הצוואר. אפשר להניח יד עליהם ולבדוק שהם רפויים.'],
      safety: 'התרגיל צריך להיות קל וללא כאב. מסחרחורת, נימול, עקצוץ, חולשה או כאב שקורן ליד, עוצרים ופונים לבדיקה.',
      why: 'סקירות והנחיית JOSPT לכאבי צוואר ממליצות על אימון שרירי הצוואר העמוקים, יחד עם חיזוק השכמות.',
      cue: 'הנהון קטן. העורף נשאר על המגבת.',
      unverified: 'מקורות שונים נותנים זמני החזקה שונים: South Tees כותבים "עד 5 שניות", ופרוטוקול Physiopedia מתקדם בהדרגה עד 10 חזרות של 10 שניות. כאן נבחר 10 × 5 לפי התוכנית מהשיחה.',
      sources: [S.southTeesDNF, S.physioDNF, S.physioDNFm, S.cuhNeck, S.jospt17]
    },
    row: {
      name: 'חתירה עם גומייה', en: 'Seated band row', move: 'row',
      dose: { sets: 3, reps: 12 }, doseText: '3 × 12',
      purpose: 'מחזק את הגב העליון והשכמות: הטרפז האמצעי, המעוינים והרחב הגבי. עוזר ליציבה ולאיזון שרירי הכתף.',
      start: 'יושבים על הרצפה, ברכיים כפופות מעט. הגומייה עוברת סביב אמצע כפות הרגליים. גב ניטרלי, כתפיים לאחור ולמטה, שורש כף היד ישר.',
      steps: ['מושכים את הגומייה ישר לאחור עם המרפקים, כמו בחתירה.', 'המרפקים עוברים צמוד לצלעות.', 'בסוף התנועה מקרבים שכמות, עוצרים כשנייה.', 'מיישרים ידיים לאט ובשליטה.'],
      breath: 'נושפים בזמן המשיכה.',
      mistakes: ['להרים כתפיים לכיוון האוזניים.', 'לתת לשכמות להתעגל קדימה בדרך חזרה.', 'להתכופף קדימה או להקשית את הגב.'],
      safety: 'שומרים על גב ניטרלי לאורך כל התנועה.',
      why: 'הנחיית JOSPT לכאבי צוואר כוללת חיזוק אזור השכמות והגפה העליונה.',
      cue: 'מרפקים לאחור, שכמות לאחור ולמטה.',
      unverified: 'Mayo Clinic כותבים שלרוב האנשים סט אחד של 12–15 חזרות מספיק. כאן נבחרו 3 סטים לפי התוכנית מהשיחה.',
      sources: [S.mayoRow, S.aceRow, S.aceCues, S.jospt17]
    },
    deadbug: {
      name: 'Dead bug', en: 'Dead bug', move: 'deadbug',
      dose: { sets: 3, reps: 8, perSide: true }, doseText: '3 × 8 לכל צד',
      purpose: 'מחזק את שרירי הבטן, כולל השריר הרוחבי העמוק, בלי עומס על הגב. השכיבה על הגב מגינה עליו.',
      start: 'שוכבים על הגב. מכווצים בעדינות את הבטן התחתונה ("כמו לסגור רוכסן של מכנסיים צמודים"). מרימים רגליים כך שהברכיים מעל האגן בזווית 90°, וידיים מעל הכתפיים לכיוון התקרה.',
      steps: ['מושיטים לאט רגל אחת קדימה, מקבילה לרצפה וכמה סנטימטרים מעליה.', 'באותו זמן מורידים את היד הנגדית לאחור מעבר לראש.', 'עוצרים רגע לפני הרצפה וחוזרים למרכז.', 'מחליפים צד. ימין ושמאל יחד = חזרה אחת.'],
      breath: 'שואפים בזמן ההורדה, נושפים בחזרה למרכז.',
      mistakes: ['הגב התחתון מתקמר ומתרומם מהרצפה. זה הסימן לקצר את התנועה.', 'לעבוד מהר. השליטה חשובה יותר מהמהירות.', 'לאבד את מתח הבטן בין החזרות.'],
      safety: 'אם הגב מתקמר, מקצרים את טווח התנועה. גרסה קלה יותר לפי ACE: כפות רגליים על הרצפה, ומרימים יד ורגל נגדיות בלבד.',
      cue: 'גב תחתון צמוד לרצפה. לאט.',
      unverified: 'Harvard Health ממליצים על 8–12 חזרות, 1–3 סטים, 3–4 פעמים בשבוע. NASM ממליצים על 3 × 10–15. מחקר על תוצאות ספציפיות של התרגיל לכאבי גב לא נמצא.',
      sources: [S.harvardDB, S.aceDB, S.nasmDB]
    },
    birddog: {
      name: 'Bird-dog', en: 'Bird-dog (McGill big 3)', move: 'birddog',
      dose: { sets: 3, reps: 8, perSide: true }, doseText: '3 × 8 לכל צד, החזקה עד 8–10 שנ׳',
      purpose: 'יציבות של עמוד השדרה והאגן. לפי מחקר של McGill, העומס על הגב בתרגיל הזה בערך חצי מעומס של פשיטת גב רגילה, כי רק חצי משרירי הגב עובדים בכל פעם.',
      start: 'עמידת שש: ידיים מתחת לכתפיים, ברכיים ברוחב האגן מתחת לאגן. גב ניטרלי ויציב, ראש בקו עם הגב.',
      steps: ['מכווצים מעט את הבטן.', 'מושיטים רגל אחת לאחור ואת היד הנגדית קדימה, עד קו מקביל לרצפה.', 'הירכיים והכתפיים נשארות ישרות, בלי סיבוב.', 'מחזיקים עד 8–10 שניות, חוזרים ומחליפים צד.'],
      breath: 'נושמים לאורך כל ההחזקה. Mayo Clinic מציעים להחזיק "שלוש נשימות עמוקות".',
      mistakes: ['להקשית את הגב או לתת לו לשקוע.', 'להרים את הראש ולהסתכל קדימה.', 'לסובב את האגן.', 'להרים יד או רגל גבוה מקו הגב.', 'לעבוד מהר במקום בשליטה.'],
      safety: 'אם כואב לברכיים על הרצפה, שמים מתחתן ריפוד. Harvard Health מזהירים שביצוע לא נכון עלול לפגוע בגב או בצוואר.',
      cue: 'יד ורגל נגדיות. אגן ישר. ראש בקו עם הגב.',
      unverified: 'זמן ההחזקה לקוח מ-McGill דרך ACE: "8–10 שניות, לא יותר". בשיחה המקורית נכתב "החזקה קצרה", כי לא נמצא אז מקור.',
      sources: [S.harvardBD, S.aceBD, S.mcgill]
    },
    sideplank: {
      name: 'פלאנק צידי על הברכיים', en: 'Modified side plank', move: 'sideplank',
      dose: { sets: 3, hold: 10, perSide: true, holdText: '10–20' }, doseText: '3 × 10–20 שנ׳ לכל צד',
      purpose: 'מחזק את שרירי הצד של הגו: האלכסוניים ו-quadratus lumborum. חלק מ"שלושת הגדולים" של McGill לגב.',
      start: 'שוכבים על הצד, רגליים אחת על השנייה, ברכיים כפופות. מרפק בזווית 90° ישירות מתחת לכתף. ראש בקו עם עמוד השדרה.',
      steps: ['נושפים ומכווצים בעדינות את שרירי הבטן.', 'מרימים את האגן מהרצפה. הברכיים נשארות על הרצפה.', 'קו ישר מהכתפיים, דרך האגן, עד הברכיים.', 'מחזיקים, יורדים לאט ומחליפים צד.'],
      breath: 'נושפים בהרמה. לא עוצרים את הנשימה בזמן ההחזקה.',
      mistakes: ['האגן צונח.', 'הגו מסתובב קדימה או אחורה.', 'המרפק לא מתחת לכתף.', 'לעצור את הנשימה.', 'להאריך את הזמן מהר מדי.'],
      safety: 'איכות לפני משך. NASM: "האיכות תמיד קודמת למשך".',
      cue: 'קו ישר מהראש לברכיים. נושמים.',
      unverified: 'המקורות נותנים טווחים שונים למתחילים: ACE מציעים 2 סטים של 10 שניות לכל צד, McGill (דרך ACE) מציע 8–10 שניות בכל החזקה, ו-NASM כותבים 20–30 שניות. הטיימר מוגדר ל-10 שניות. אפשר להאריך עד 20 כשזה קל.',
      sources: [S.aceSP, S.nasmSP, S.mcgill]
    },
    bridge: {
      name: 'גשר ישבן', en: 'Glute bridge', move: 'bridge',
      dose: { sets: 3, reps: 12 }, doseText: '3 × 12',
      purpose: 'מחזק את שרירי הישבן, השרירים שדוחפים אותך בעליות עם תיק.',
      start: 'שוכבים על הגב, ברכיים כפופות, כפות רגליים על הרצפה ברוחב האגן, ידיים לצד הגוף. מכווצים מעט את הבטן.',
      steps: ['מכווצים את הישבן ודוחפים דרך העקבים.', 'מרימים את האגן עד קו ישר מהברכיים לכתפיים.', 'מחזיקים 3–5 שניות למעלה.', 'יורדים לאט, חוליה אחר חוליה.'],
      breath: 'נושפים בעלייה. לא עוצרים את הנשימה.',
      mistakes: ['להרים את האגן גבוה מדי ולהקשית את הגב התחתון. התנועה באה מהירכיים, לא מהגב.', 'השכמות מתרוממות מהרצפה.', 'התכווצות בשרירים האחוריים של הירך. מקרבים את העקבים לישבן ומתרכזים בישבן.'],
      safety: 'לא להקשית את הגב התחתון בשיא התנועה.',
      cue: 'ישבן מכווץ. קו ישר כתפיים-ברכיים.',
      unverified: 'Cleveland Clinic ממליצים על 2 סטים של 15. Mayo Clinic מציעים להתחיל ב-5 חזרות ביום ולהעלות בהדרגה עד 30. כאן נבחר 3 × 12 לפי התוכנית מהשיחה.',
      sources: [S.aceBr, S.ccBr, S.mayoBack]
    },
    clam: {
      name: 'צדפה (Clamshell)', en: 'Clamshell', move: 'clam',
      dose: { sets: 3, reps: 15, perSide: true }, doseText: '3 × 15 לכל צד',
      purpose: 'מחזק את הגלוטאוס מדיוס, השריר בצד הירך שמייצב את האגן ואת הברך בהליכה. במחקר EMG (JOSPT 2013) הצדפה הפעילה את שרירי הישבן ביחס הגבוה ביותר לעומת שריר הצד TFL.',
      start: 'שוכבים על הצד. כתפיים, אגן ועקבים בקו אחד. ברכיים כפופות בערך 90°. הראש נח על היד התחתונה.',
      steps: ['מכווצים את הישבן. כפות הרגליים צמודות.', 'פותחים את הברך העליונה כלפי מעלה, כמו צדפה.', 'האגן לא מתגלגל לאחור.', 'יורדים לאט ובשליטה.'],
      breath: 'לא נמצאה הנחיה ספציפית לנשימה. נושמים רגיל.',
      mistakes: ['לגלגל את האגן לאחור כדי לפתוח יותר. זה מעביר את העבודה משריר המטרה.', 'לעבוד בתנופה.', 'אגן וכתפיים לא בקו אחד.'],
      safety: 'התרגיל מופיע בתוכנית לברכיים של Royal Orthopaedic Hospital. עושים אותו בעדינות ולאט.',
      cue: 'עקבים צמודים. האגן לא זז.',
      unverified: 'ROH ממליצים על 10 חזרות. כאן נבחר 3 × 15 לפי התוכנית מהשיחה. אם זה קשה, מתחילים מ-10.',
      sources: [S.rohKnee, S.nasmClam, S.selkowitz]
    },
    hipflexor: {
      name: 'מתיחת כופפי ירך בעמידה', en: 'Standing hip flexor stretch', move: 'hipflexor',
      dose: { sets: 2, hold: 30, perSide: true }, doseText: '2 × 30 שנ׳ לכל צד',
      purpose: 'מותח את כופפי הירך בקדמת הירך של הרגל האחורית. הגרסה בעמידה ולא על הברך, בגלל הברכיים.',
      start: 'עמידת צעד: הרגל שמותחים מאחור וישרה, הברך הקדמית כפופה מעט. אפשר להיתמך במעקה או בקיר.',
      steps: ['מכווצים את הישבן של הרגל האחורית.', 'מטים את האגן לאחור ("מכניסים את עצם הזנב").', 'מעבירים את משקל הגוף קדימה עד שמרגישים מתיחה בקדמת הירך האחורית.', 'מחזיקים 20–30 שניות. הגב נשאר ישר.'],
      breath: 'נושמים רגיל.',
      mistakes: ['להקשית את הגב התחתון במקום להטות את האגן.', 'להתכופף במותניים.', 'לקפוץ או לנדנד את המתיחה.'],
      safety: 'מתיחה היא מתח, לא כאב. בכאבי ברך קדמיים, הנחיית NHS ממליצה להימנע מכריעה. לכן נבחרה הגרסה בעמידה. מקור שאומר זאת במפורש על המתיחה הזו לא נמצא, וזו הסקה.',
      cue: 'ישבן מכווץ, אגן קדימה, גב ישר.',
      sources: [S.wigan, S.mayoStretch, S.rbKnee, S.acsm2011]
    },
    hamstring: {
      name: 'מתיחת שרירים אחוריים של הירך', en: 'Supine hamstring stretch with towel', move: 'hamstring',
      dose: { sets: 2, hold: 30, perSide: true }, doseText: '2 × 30 שנ׳ לכל צד',
      purpose: 'מותח את השרירים האחוריים של הירך בשכיבה, בלי עומס על הגב ועל הברכיים.',
      start: 'שוכבים על הגב, ברכיים כפופות. מגבת סביב כף הרגל של הרגל שמותחים.',
      steps: ['מרימים את הרגל.', 'מיישרים לאט את הברך עד שמרגישים משיכה עדינה ויציבה מאחורי הירך.', 'מחזיקים בלי לנדנד.', 'להתקדמות: מיישרים את הרגל השנייה על הרצפה.'],
      breath: 'נושפים בעדינות בזמן יישור הרגל.',
      mistakes: ['לנדנד ולקפוץ.', 'להזיז את האגן או את הגב התחתון.', 'למתוח עד כאב.'],
      safety: 'South Tees: מי שיש לו בעיית גב, שיתייעץ עם פיזיותרפיסט לפני התרגיל.',
      cue: 'משיכה עדינה. לא מנדנדים.',
      sources: [S.stHam, S.aceHam, S.mayoStretch, S.acsm2011]
    },
    calf: {
      name: 'מתיחת שוק מול קיר', en: 'Wall calf stretch (gastrocnemius & soleus)', move: 'calf',
      dose: { sets: 2, hold: 30, perSide: true }, doseText: '30 שנ׳ לכל גרסה, לכל רגל',
      purpose: 'שתי גרסאות: ברך ישרה מותחת את התאומים (gastrocnemius), וברך כפופה מעט מותחת את הסוליה (soleus).',
      start: 'נשענים בידיים על קיר. הרגל שמותחים מאחור, כף הרגל מכוונת ישר לקיר.',
      steps: ['גרסה 1: מותחים את הברך האחורית עד שהיא ישרה ונשענים לקיר. עוצרים רגע לפני שהעקב מתרומם.', 'גרסה 2: באותה עמידה מכופפים את הברך האחורית. האגן זז מעט אחורה, העקב נשאר על הרצפה.', 'מחזיקים כ-30 שניות בכל גרסה.'],
      breath: 'נושמים רגיל.',
      mistakes: ['העקב מתרומם.', 'כף הרגל מסובבת פנימה או החוצה.', 'הברך מתכופפת בגרסה הראשונה.'],
      safety: 'עם שבר מאמץ בשוקה, ההנחיה ב-Physiopedia היא להשתמש בכאב כמדד ולהתקדם רק בלי כאב. אם המתיחה מעוררת כאב נקודתי בעצם, עוצרים.',
      cue: 'עקב על הרצפה. כף הרגל ישר לקיר.',
      sources: [S.rohCalf, S.mayoStretch]
    },
    catcow: {
      name: 'חתול-פרה', en: 'Cat-cow', move: 'catcow',
      dose: { sets: 1, reps: 10 }, doseText: '5–10 חזרות',
      purpose: 'תנועתיות עדינה של עמוד השדרה. טוב לבוקר בשביל, אחרי לילה בשק שינה.',
      start: 'עמידת שש: ידיים מתחת לכתפיים, ברכיים מתחת לאגן. ראש בקו עם הגב, מבט לרצפה.',
      steps: ['פרה, בשאיפה: מרימים את עצם הזנב, הבטן שוקעת בעדינות, המבט עולה מעט.', 'חתול, בנשיפה: מעגלים את הגב כלפי מעלה, מכניסים את עצם הזנב ואת הסנטר.', 'נשימה מלאה בכל תנוחה. לאט.'],
      breath: 'שאיפה בפרה, נשיפה בחתול.',
      mistakes: ['לזרוק את הראש לאחור. שומרים על צוואר ארוך.', 'לעבוד מהר.'],
      safety: 'אם הברכיים רגישות, שמים ריפוד מתחתן.',
      cue: 'שאיפה: פרה. נשיפה: חתול.',
      sources: [S.ccCat, S.mayoBack]
    },
    shoulders: {
      name: 'גלגולי כתפיים וקירוב שכמות', en: 'Shoulder rolls & scapular squeeze', move: 'shoulders',
      dose: { sets: 1, reps: 10 }, doseText: '5 לכל כיוון + 5 קירובים',
      purpose: 'משחרר את הכתפיים והצוואר אחרי שעות עם תיק, ומפעיל את השרירים שבין השכמות.',
      start: 'עומדים או יושבים זקוף, ידיים רפויות לצד הגוף.',
      steps: ['מגלגלים את שתי הכתפיים לאט במעגל, 3–5 פעמים, ואז בכיוון ההפוך.', 'קירוב שכמות: מקרבים את השכמות זו לזו ומטה, מחזיקים כ-5 שניות ומשחררים. 3–5 פעמים.', 'זה צריך להרגיש קל ולא מאולץ.'],
      breath: 'נשימה רגועה ויציבה.',
      mistakes: ['להרים את הכתפיים לאוזניים בזמן קירוב השכמות. מכוונים "אחורה ולמטה".', 'לכפות את התנועה.'],
      cue: 'לאט. אחורה ולמטה.',
      sources: [S.frimley, S.mayoScap, S.aceCues]
    }
  };

  global.CONTENT = {
    ex,
    groups: [
      { title: 'חיזוק', sub: '3–4 פעמים בשבוע, עם יום מנוחה ביניהם.', ids: ['chin', 'row', 'deadbug', 'birddog', 'sideplank', 'bridge', 'clam'] },
      { title: 'מתיחות ותנועתיות', sub: 'אפשר לעשות כל יום.', ids: ['hipflexor', 'hamstring', 'calf', 'catcow', 'shoulders'] }
    ],
    plan: {
      home: ['chin', 'row', 'deadbug', 'birddog', 'sideplank', 'bridge', 'clam', 'hipflexor', 'hamstring'],
      stretch: ['hipflexor', 'hamstring', 'calf'],
      freqShort: '3–4 פעמים בשבוע',
      doctorFirst: 'נמצאו שברי מאמץ בשוקיים, ולא ידוע אם החלימו. לפני שיוצאים לשביל, צריך תשובה מרופא (עדיף מרפאת רפואת ספורט): האם השברים החלימו, ומותר ללכת 20–25 ק"מ ביום עם תיק? אם התשובה היא לא, עדיף לדחות בכמה שבועות מאשר לעצור באמצע.',
      restNote: 'המקורות לא קובעים זמן מנוחה מחייב לתרגילים האלה, לכן אתה בוחר. ACSM ממליצים לאמן כל קבוצת שרירים לפחות פעמיים בשבוע. התוכנית מהשיחה: 3–4 פעמים בשבוע עם יום מנוחה ביניהם.'
    },
    trail: {
      stop: {
        title: 'לעצור ולהגיע לבדיקה אם',
        items: ['כאב בשוקה מופיע בזמן ההליכה, או נשאר גם בבוקר שאחרי', 'כאב במנוחה או בלילה', 'כאב נקודתי בעצם, נפיחות או רגישות במקום אחד', 'צליעה', 'לא מצליחים לדרוך על הרגל: פונים לטיפול מיד'],
        sources: [S.aaosSF, S.warden, S.milgrom21]
      },
      routines: [
        { id: 't_am', title: 'בבוקר', time: '5 דקות', items: [{ id: 'catcow', dose: { sets: 1, reps: 10 }, doseText: '10 חזרות' }, { id: 'chin', dose: { sets: 1, reps: 10, hold: 3, relax: 2 }, doseText: '10 חזרות' }, { id: 'bridge', dose: { sets: 1, reps: 10 }, doseText: '10 חזרות' }] },
        { id: 't_pm', title: 'בערב', time: '10 דקות', items: [{ id: 'deadbug', dose: { sets: 1, reps: 8, perSide: true }, doseText: 'סט אחד' }, { id: 'birddog', dose: { sets: 1, reps: 6, perSide: true }, doseText: 'סט אחד' }, { id: 'sideplank', dose: { sets: 1, hold: 10, perSide: true }, doseText: 'סט אחד' }, { id: 'hipflexor', dose: { sets: 1, hold: 30, perSide: true }, doseText: '30 שנ׳ לכל צד' }, { id: 'hamstring', dose: { sets: 1, hold: 30, perSide: true }, doseText: '30 שנ׳ לכל צד' }, { id: 'calf', dose: { sets: 1, hold: 30, perSide: true }, doseText: '30 שנ׳ לכל רגל' }] },
        { id: 't_break', title: 'בהפסקות', time: 'בכל עצירה', items: [{ label: 'להוריד את התיק', doseText: 'קודם כל' }, { id: 'shoulders', dose: { sets: 1, reps: 10 }, doseText: '5 לכל כיוון' }, { label: 'הכנסת סנטר בעמידה', doseText: '5 חזרות' }], note: 'אפשר לעשות את ההפסקות בלי טיימר.' }
      ],
      sections: [
        { title: 'אם יוצאים: כך מורידים את הסיכון', evidence: 'low', body: `
          <p><b>מרחק:</b> בשבוע הראשון מרחקים קצרים בהרבה מהיעד, ומגדילים בהדרגה. ימי מנוחה במהלך השבוע.</p>
          <p><b>כלל הכאב:</b> בהנחיה של Warden ועמיתים (JOSPT 2021) לפציעות עצם בסיכון נמוך, רמת הכאב המקובלת בזמן העומס, אחריו וביום שאחרי היא 0 מתוך 10.</p>
          <p><b>מקלות הליכה:</b> במחקרי מעבדה קטנים, מקלות הורידו את העומסים על הברך בירידה ב-12%–25%. אין מחקר שבדק אם הם מונעים פציעות.</p>
          <p><b>חגורת מותניים:</b> מעבירה בערך 30% מהמשקל מהכתפיים לאגן, ומורידה עומס מהכתפיים ומהגב העליון. היא <u>לא</u> מורידה עומס מהשוקיים, כי כל המשקל עדיין עובר דרך הרגליים.</p>
          <p><b>משקל התיק:</b> לא נמצא מקור מבוסס למשקל מקסימלי למבוגרים. עומס כבד יותר ולאורך זמן ארוך יותר מעלה את הסיכון לשברי מאמץ, לכן תיק קל ככל האפשר.</p>`,
          sources: [S.warden, S.schwameder, S.bohne, S.lafiandra, S.knapik, S.walsh] }
      ],
      calc: {
        intro: 'מראה מה עלייה קבועה בכל שבוע אומרת במספרים. את מרחק ההתחלה צריך לקבוע עם הרופא.',
        caveat: '<b>חשוב:</b> "כלל ה-10%" פופולרי, אבל ניסוי מבוקר (Buist 2008, 532 רצים מתחילים) לא מצא שהוא מפחית פציעות. סקירה מ-2024 קבעה שהוא לא מתאים לכולם. ההנחיות מעדיפות התקדמות לפי כאב: 0/10 בזמן ההליכה, אחריה וביום שאחרי. המחשבון הוא כלי לתכנון, לא המלצה רפואית.',
        sources: [S.buist, S.george, S.warden]
      }
    },
    health: {
      er: {
        title: 'למיון מיד אם',
        items: ['חוסר תחושה או עקצוץ באזור המפשעה, בין הירכיים או סביב פי הטבעת והישבן', 'קושי חדש במתן שתן, דליפה, או חוסר תחושה מתי השלפוחית מלאה', 'חוסר שליטה על יציאות', 'כאב, נימול או עקצוץ חדשים בשתי הרגליים', 'חולשה ברגליים שהולכת ומחמירה'],
        note: 'אלה סימנים אפשריים של תסמונת cauda equina, מצב חירום. עיכוב עלול לגרום לנזק קבוע. סימנים בצוואר שמצריכים בדיקה דחופה: ידיים מגושמות (הפלת חפצים, קושי בכפתורים או בכתב יד) או חוסר יציבות בהליכה.',
        sources: [S.ces1, S.ces2, S.dcm, S.acpImg]
      },
      doctor: [
        { id: 'q1', text: '"האם השברים החלימו, ומותר לי ללכת 20–25 ק"מ ביום עם תיק?"' },
        { id: 'q2', text: 'איפה בדיוק השבר בשוקה, ומה הדרגה שלו בהדמייה? שבר בצד הקדמי של השוקה נחשב בסיכון גבוה ועלול לדרוש 4–6 חודשים בלי עומס, ולפעמים ניתוח. שבר בצד האחורי-פנימי בדרך כלל מחלים בטיפול שמרני.' },
        { id: 'q3', text: 'האם לבדוק ויטמין D וסידן? (בניסוי בטירונים בחיל הים האמריקאי, תוסף סידן וויטמין D הוריד שברי מאמץ ב-20%. המחקר היה בנשים.)' },
        { id: 'q4', text: 'האם מתאימה לי בדיקת צפיפות עצם (DEXA)? לפי הסקירות, לא באופן שגרתי. שוקלים אותה בשברים חוזרים, באתר בסיכון גבוה או בבדיקות דם חריגות.' },
        { id: 'q5', text: 'אם כאב הגב או הצוואר קורן לרגל או ליד, או מלווה בנימול או חולשה: האם צריך MRI?' },
        { id: 'q6', text: 'הפניה לפיזיותרפיה. שיקום של שבר מאמץ מתבצע בשלבים מוגדרים, ועדיף שפיזיותרפיסט ילווה אותו.' },
        { id: 'q7', text: 'לבדוק מול אגף השיקום של משרד הביטחון אם אפשר להגיש תביעה להכרה בפגיעה, כי היא התחילה בשירות. את הנוהל העדכני כדאי לבדוק באתר הרשמי.' }
      ],
      sections: [
        { title: 'שבר מאמץ בשוקה: מה זה ואיך מזהים', evidence: 'guide', body: `
          <p>שבר מאמץ הוא הצטברות של נזק זעיר בעצם מעומס חוזר, למשל מסעות עם משקל. בצבא הישראלי זו בעיה מוכרת: במחקר משנת 1985, ל-31% מ-295 טירוני חי"ר היו שברי מאמץ, ו-80% מהם בשוקה או בירך.</p>
          <p><b>התפתחות הכאב (AAOS):</b> בהתחלה כאב רק בסוף פעילות, שעובר במנוחה. אחר כך כאב לאורך כל הפעילות ובהליכה רגילה, ובהמשך כאב במיטה בלילה, נפיחות ושטף דם.</p>
          <p><b>בפרוטוקול צה"ל (Milgrom 2021):</b> רגישות במקטע של עד 10 ס"מ בעצם, וכאב בקפיצה על רגל אחת, חשודים כשבר. הטיפול הראשוני היה 10–14 ימי מנוחה, וזה הצליח ביותר משני שלישים מהמקרים.</p>`,
          sources: [S.aaosSF, S.aafp24, S.milgrom85, S.milgrom21] },
        { title: 'כמה זמן לוקחת ההחלמה', evidence: 'guide', body: `
          <ul class="clean">
            <li><b>שבר בסיכון נמוך (צד אחורי-פנימי של השוקה):</b> במטה-אנליזה (BJSM 2023), חזרה לספורט אחרי כ-44 ימים בממוצע.</li>
            <li><b>שבר בצד הקדמי (סיכון גבוה):</b> 5%–15% משברי השוקה. ייתכן צורך ב-4–6 חודשים של מנוחה יחסית, או בניתוח. "הקו השחור המפחיד" בצילום מעיד על אי-איחוי.</li>
            <li><b>אצל טירוני הנחתים הבריטיים:</b> שיקום אחרי שבר מאמץ בשוקה נמשך בממוצע 21.1 שבועות, בטווח של 10–47.</li>
          </ul>
          <p>לכן המיקום והדרגה בהדמייה קובעים אם מדובר בשבועות או בחודשים.</p>`,
          sources: [S.hoenig, S.highRisk, S.blackLine, S.wood] },
        { title: 'טיפול וחזרה הדרגתית', evidence: 'guide', body: `
          <p><b>העיקרון (AAOS):</b> להוריד עומס מהעצם כדי שתחלים. מנוחה מפעילויות שכואבות. שחייה ואופניים הן חלופות טובות. אם כואב בהליכה, לפעמים צריך נעל קשיחה, מגף או קביים.</p>
          <p><b>מתי מתקדמים:</b> לפי סקירה מ-2024, לפני חזרה לעומס גבוה צריך:</p>
          <ul class="clean"><li>שהרגישות בעצם תיעלם</li><li>הליכה ללא כאב</li><li>בשבר בסיכון גבוה, ריפוי שנראה בהדמייה</li><li>מעבר מבחני כוח ותפקוד</li><li>זיהוי של הגורמים שתרמו לפציעה</li></ul>
          <p><b>כלל הכאב:</b> 0/10 בזמן הפעילות, אחריה וביום שאחרי.</p>
          <p class="sub">רמת הראיות: רוב ההנחיות לחזרה מבוססות על דעת מומחים ומחקרי תצפית. אין ניסויים מבוקרים על חזרה להליכה אחרי שבר כזה.</p>`,
          sources: [S.aaosSF, S.george, S.warden] },
        { title: 'הגב והצוואר', evidence: 'guide', body: `
          <p>כאבי הגב והצוואר הם כנראה בעיה נפרדת מהשוקיים. ההדמייה שמצאה את שברי המאמץ (מיפוי עצמות) לא מראה דיסקים, ולכן לא יכולה לאשר או לשלול בלט.</p>
          <p><b>מה ההנחיות ממליצות (NICE NG59, ACP 2017, JOSPT):</b></p>
          <ul class="clean"><li>להמשיך בפעילות רגילה ככל האפשר</li><li>פעילות גופנית ותרגילי חיזוק וסיבולת לגו</li><li>לצוואר: אימון שרירי הצוואר העמוקים יחד עם חיזוק השכמות והידיים</li><li>לא לשכב במנוחה ממושכת, כי אנשים שנשארים פעילים מחלימים מהר יותר</li><li>לא לבצע הדמייה באופן שגרתי</li><li>לא להשתמש בחגורות גב</li></ul>
          <p><b>חום:</b> ראיות בינוניות לירידה קטנה וקצרת טווח בכאב ובמגבלה. בשילוב תרגילים התוצאה טובה יותר.</p>
          <p><b>תרופות:</b> לפי NICE, משככי כאבים נוגדי דלקת במינון הנמוך האפשרי ולזמן הקצר האפשרי, ואקמול לבד לא מומלץ לכאבי גב. החלטה על תרופות רק עם רופא.</p>
          <p><b>תרגילים לעומת טיפול רגיל:</b> בסקירת Cochrane (2021, 249 מחקרים), תרגילים שיפרו כאב בממוצע ב-15 נקודות מתוך 100 לעומת טיפול רגיל.</p>`,
          sources: [S.nice, S.acp, S.jospt21, S.jospt17, S.bedrest, S.cochraneHeat, S.cochraneEx] },
        { title: 'החשש מבלט (פריצת דיסק)', evidence: 'guide', body: `
          <p><b>אבחון:</b> מאבחנים בלט בעיקר לפי התסמינים. אם הם לא משתפרים, שולחים ל-MRI.</p>
          <p><b>סימנים ללחץ על עצב:</b> כאב שקורן לרגל או ליד, נימול, עקצוץ או חולשה.</p>
          <p><b>מתי MRI:</b> לפי ACP, כשיש חסר נוירולוגי חמור או מחמיר, כשחושדים בבעיה רצינית, או כשכאב קורן נמשך ושוקלים זריקה או ניתוח.</p>
          <p><b>הסיכויים:</b> לפי סקירה מ-2024, התסמינים חולפים אצל 60%–80% תוך 6–12 שבועות, ואצל 80%–90% לטווח ארוך. כשאין חסר נוירולוגי משמעותי, מומלצים 6–12 שבועות של טיפול שמרני. חלק גדול מהבלטים נספגים מעצמם, במיוחד הגדולים.</p>
          <p class="sub">תיקון לשיחה המקורית: שם נכתב "60%–90% תוך 6–12 שבועות". המספרים המדויקים מהמקור הם 60%–80% בטווח הזה.</p>`,
          sources: [S.nhsDisc, S.aaosDisc, S.acpImg, S.aerzte] },
        { title: 'גורמי סיכון ובדיקות', evidence: 'guide', body: `
          <p>ויטמין D נמוך, צריכת סידן נמוכה ומחסור באנרגיה (אכילה מעטה ביחס למאמץ) מעלים את הסיכון לשברי מאמץ. AAFP ממליצים לשפר תזונה, צריכת קלוריות, סידן ותוסף ויטמין D.</p>
          <p>בדיקת צפיפות עצם לא נעשית באופן שגרתי. שוקלים אותה בשברים חוזרים, באתר בסיכון גבוה, בבדיקות דם חריגות או בירידה משמעותית במשקל.</p>`,
          sources: [S.aafp24, S.lappe, S.dxa] },
        { title: 'זכויות: אגף השיקום', body: `
          <p>אגף השיקום במשרד הביטחון הוא הגוף שמוסמך בחוק לטפל בחיילים משוחררים שנפגעו בשירות. פרטי ההגשה בדקנו רק באתרי עורכי דין ולא באתר הרשמי, ולכן כדאי לבדוק את הנוהל העדכני ישירות באתר משרד הביטחון.</p>`,
          sources: [S.mod] }
      ]
    },
    install: `<ol class="clean">
      <li>פותחים את הכתובת פעם אחת כשיש אינטרנט, וממתינים עד שלמעלה כתוב "זמין גם בלי קליטה".</li>
      <li><b>אייפון (Safari):</b> כפתור השיתוף ← "הוספה למסך הבית".</li>
      <li><b>אנדרואיד (Chrome):</b> תפריט ⋮ ← "התקנת אפליקציה" או "הוספה למסך הבית".</li>
      <li>מעכשיו פותחים מהאייקון, גם בלי קליטה. היומן נשמר בטלפון בלבד.</li>
      <li>הקראה קולית בלי קליטה עובדת רק אם במכשיר מותקן קול עברי (באייפון: הגדרות ← נגישות ← תוכן מוקרא ← קולות).</li></ol>`,
    about: 'האפליקציה מבוססת על התוכנית מהשיחה בפרויקט "מאמן", ועל מחקר במקורות מקצועיים: הנחיות NHS ו-NICE, AAOS, AAFP, ACSM, JOSPT, Cochrane, Mayo Clinic, Cleveland Clinic, Harvard Health ומאמרים שפיטים. <b>מגבלה:</b> בזמן המחקר לא ניתן היה לפתוח את דפי המקור עצמם, והמידע נאסף מתקצירי חיפוש שמקושרים לכל מקור. לכן כדאי לפתוח את הקישורים ולוודא. האפליקציה לא מחליפה רופא או פיזיותרפיסט שבודקים אותך.'
  };
})(window);
