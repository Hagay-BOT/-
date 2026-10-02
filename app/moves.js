/* Keyframes for each exercise. Floor line at y=200. Coordinates are in a 400x230 viewBox.
   say = caption shown while the pose is held; sayMove = caption while moving into the next pose. */
(function (global) {
  'use strict';
  // shared base poses
  const supineArms = { armN: { u: 2, l: 0, h: 0 }, armF: { u: 2, l: 0, h: 0 } };
  const hookLegs = (fx) => ({ legN: { ik: [fx, 194], bend: -1, f: 0 }, legF: { ik: [fx - 4, 194], bend: -1, f: 0 } });
  const supine = (extra) => Object.assign({ anchor: 'shoulder', at: [178, 187], trunk: 180, neck: 180, fr: 90 }, supineArms, hookLegs(298), extra || {});

  // quadruped: shoulder over hands, hip over knees
  const quad = (extra) => Object.assign({
    anchor: 'hip', at: [252, 150], trunk: 190.5, neck: 192, fr: -90, bend: 0,
    armN: { ik: [190, 193], bend: 1, h: -90 }, armF: { ik: [186, 193], bend: 1, h: -90 },
    legN: { ik: [292, 193], bend: 1, f: 4 }, legF: { ik: [288, 193], bend: 1, f: 4 }
  }, extra || {});

  const standing = (extra) => Object.assign({
    anchor: 'hip', at: [200, 117], trunk: -90, neck: -90, fr: -90,
    armN: { u: 92, l: 90, h: 0 }, armF: { u: 88, l: 90, h: 0 },
    legN: { ik: [196, 194], bend: -1, f: 180 }, legF: { ik: [204, 194], bend: -1, f: 180 }
  }, extra || {});

  const MOVES = {
    chin: {
      alt: 'שכיבה על הגב, הסנטר נמשך פנימה בעדינות', face: 90,
      hl: [],
      keys: [
        { pose: supine({ fr: 90 }), hold: 1.2, move: 1.2, say: 'מנח התחלה: ראש על מגבת מקופלת, מבט לתקרה' },
        { pose: supine({ fr: 122, head: -4, hl: [['headBase', 'chest']] }), hold: 3, move: 1.2, say: 'מהנהנים בעדינות "כן": הסנטר פנימה, העורף מתארך', sayMove: 'מכניסים סנטר לאט' }
      ]
    },
    row: {
      alt: 'ישיבה עם ברכיים כפופות מעט, גומייה סביב כפות הרגליים, משיכת מרפקים לאחור', face: 90,
      band: j => `M${j.toeN[0]} ${j.toeN[1] - 3} L${j.handN[0]} ${j.handN[1]}`,
      keys: [
        { pose: { anchor: 'hip', at: [175, 186], trunk: -90, neck: -90, fr: 90, armN: { ik: [262, 158], bend: 1, h: 0 }, armF: { ik: [258, 160], bend: 1, h: 0 }, legN: { u: -10, l: 12, f: -76 }, legF: { u: -9, l: 13, f: -76 } }, hold: .8, move: 1.3, say: 'גב זקוף, ידיים מושטות, הגומייה מתוחה קלות' },
        { pose: { anchor: 'hip', at: [175, 186], trunk: -90, neck: -90, fr: 90, sh: [-3, 0], armN: { ik: [196, 150], bend: 1, h: 0 }, armF: { ik: [192, 152], bend: 1, h: 0 }, legN: { u: -10, l: 12, f: -76 }, legF: { u: -9, l: 13, f: -76 }, hl: [['upTrunk', 'chest'], ['shoulder', 'elbowN']] }, hold: 1, move: 1.6, say: 'מקרבים שכמות, מרפקים צמודים לגוף', sayMove: 'מושכים מרפקים לאחור' }
      ]
    },
    deadbug: {
      alt: 'שכיבה על הגב, ידיים לתקרה, ברכיים ב-90 מעלות, הורדת יד ורגל נגדיות', face: 90,
      keys: [
        { pose: supine({ armN: { u: -90, l: -90, h: 0 }, armF: { u: -88, l: -88, h: 0 }, legN: { u: -90, l: 0, f: -90 }, legF: { u: -92, l: 2, f: -90 } }), hold: .8, move: 1.8, say: 'ידיים לתקרה, ברכיים מעל האגן, גב תחתון צמוד לרצפה' },
        { pose: supine({ armN: { u: 192, l: 190, h: 0 }, armF: { u: -88, l: -88, h: 0 }, legN: { u: -90, l: 0, f: -90 }, legF: { u: -14, l: -12, f: -90 }, hl: [['lowTrunk', 'midTrunk']] }), hold: 1, move: 1.8, say: 'יד ורגל נגדיות מתרחקות. הגב לא מתרומם', sayMove: 'מורידים לאט יד ורגל נגדיות' },
        { pose: supine({ armN: { u: -90, l: -90, h: 0 }, armF: { u: -88, l: -88, h: 0 }, legN: { u: -90, l: 0, f: -90 }, legF: { u: -92, l: 2, f: -90 } }), hold: .6, move: 1.8, say: 'חוזרים למרכז' },
        { pose: supine({ armN: { u: -90, l: -90, h: 0 }, armF: { u: 192, l: 190, h: 0 }, legN: { u: -14, l: -12, f: -90 }, legF: { u: -92, l: 2, f: -90 }, hl: [['lowTrunk', 'midTrunk']] }), hold: 1, move: 1.8, say: 'הצד השני', sayMove: 'מחליפים צד' }
      ]
    },
    birddog: {
      alt: 'עמידת שש, הושטת יד ורגל נגדיות לקו ישר', face: -90, holdKeys: [1, 3],
      keys: [
        { pose: quad(), hold: .8, move: 1.8, say: 'ידיים מתחת לכתפיים, ברכיים מתחת לאגן, גב ישר' },
        { pose: quad({ armN: { u: 182, l: 182, h: 0 }, legF: { u: 2, l: 2, f: 80 }, hl: [['lowTrunk', 'midTrunk'], ['hip', 'thighTopF']] }), hold: 3, move: 1.8, say: 'יד ורגל נגדיות בקו ישר. מחזיקים. האגן לא מסתובב', sayMove: 'מושיטים לאט' },
        { pose: quad(), hold: .6, move: 1.8, say: 'חוזרים' },
        { pose: quad({ armF: { u: 182, l: 182, h: 0 }, legN: { u: 2, l: 2, f: 80 }, hl: [['lowTrunk', 'midTrunk'], ['hip', 'thighTopN']] }), hold: 3, move: 1.8, say: 'הצד השני', sayMove: 'מחליפים צד' }
      ]
    },
    sideplank: {
      alt: 'פלאנק צידי על המרפק והברכיים, הרמת האגן לקו ישר', face: -90,
      keys: [
        { pose: { anchor: 'hip', at: [224, 188], trunk: 197, neck: 197, fr: -90, armF: { ep: [152, 194], wp: [124, 194], h: 0 }, armN: { ik: [214, 180], bend: 1, h: 0 }, legN: { u: 2, l: -50, f: -140 }, legF: { u: 3, l: -48, f: -140 } }, hold: .8, move: 1.6, say: 'שוכבים על הצד, מרפק מתחת לכתף, ברכיים כפופות' },
        { pose: { anchor: 'hip', at: [216, 166], trunk: 194, neck: 194, fr: -90, armF: { ep: [152, 194], wp: [124, 194], h: 0 }, armN: { ik: [208, 158], bend: 1, h: 0 }, legN: { u: 20, l: -30, f: -120 }, legF: { u: 21, l: -28, f: -120 }, hl: [['lowTrunk', 'upTrunk']] }, hold: 2.5, move: 1.6, say: 'קו ישר מהראש לברכיים. מחזיקים', sayMove: 'מרימים את האגן' }
      ]
    },
    bridge: {
      alt: 'שכיבה על הגב, ברכיים כפופות, הרמת האגן לקו ישר', face: 90,
      keys: [
        { pose: supine(), hold: .8, move: 1.6, say: 'שכיבה על הגב, כפות רגליים על הרצפה ברוחב האגן' },
        { pose: supine({ trunk: 157, hl: [['hip', 'thighTopN']] }), hold: 3, move: 1.8, say: 'קו ישר מהכתפיים לברכיים. מחזיקים 3 שניות', sayMove: 'דוחפים דרך העקבים ומרימים אגן' }
      ]
    },
    clam: {
      alt: 'שכיבה על הצד, ברכיים כפופות, פתיחת הברך העליונה בלי לגלגל את האגן', face: -90, mat: false,
      keys: [
        { pose: { anchor: 'hip', at: [240, 184], trunk: 180, neck: 182, fr: -90, armF: { u: 182, l: 182, h: 0 }, armN: { ik: [222, 172], bend: -1, h: 0 }, legF: { kp: [276, 194], ap: [300, 186], f: 0 }, legN: { kp: [274, 186], ap: [300, 182], f: 0 } }, hold: .8, move: 1.4, say: 'שוכבים על הצד, ברכיים כפופות, עקבים צמודים' },
        { pose: { anchor: 'hip', at: [240, 184], trunk: 180, neck: 182, fr: -90, armF: { u: 182, l: 182, h: 0 }, armN: { ik: [222, 172], bend: -1, h: 0 }, legF: { kp: [276, 194], ap: [300, 186], f: 0 }, legN: { kp: [262, 146], ap: [300, 182], f: 0 }, hl: [['hip', 'thighTopN']] }, hold: 1, move: 1.4, say: 'הברך העליונה נפתחת. העקבים נשארים צמודים', sayMove: 'פותחים כמו צדפה' }
      ]
    },
    hipflexor: {
      alt: 'מתיחת כופפי ירך בעמידה, רגל אחורית ישרה, האגן נדחף קדימה', face: -90,
      keys: [
        { pose: standing({ at: [205, 116], armN: { ik: [212, 120], bend: -1, h: 0 }, armF: { ik: [208, 121], bend: -1, h: 0 }, legN: { ik: [170, 194], bend: -1, f: 180 }, legF: { u: 52, l: 52, f: 150 } }), hold: 1, move: 2, say: 'עמידת צעד, רגל אחורית ישרה, ידיים על המותניים' },
        { pose: standing({ at: [196, 122], trunk: -88, armN: { ik: [203, 126], bend: -1, h: 0 }, armF: { ik: [199, 127], bend: -1, h: 0 }, legN: { ik: [170, 194], bend: -1, f: 180 }, legF: { u: 46, l: 46, f: 146 }, hl: [['hip', 'thighTopF']] }), hold: 3, move: 2, say: 'עצם הזנב מטה, ישבן מכווץ, משקל קדימה. מתיחה בקדמת הירך האחורית', sayMove: 'מגלגלים את האגן, ואז מעבירים משקל קדימה' }
      ]
    },
    hamstring: {
      alt: 'שכיבה על הגב, מגבת סביב כף הרגל, הרמת רגל ישרה למתיחה', face: 90,
      band: j => `M${j.handN[0]} ${j.handN[1]} L${j.toeN[0] - 4} ${j.toeN[1] + 2} M${j.handF[0]} ${j.handF[1]} L${j.toeN[0] - 2} ${j.toeN[1] + 4}`,
      keys: [
        { pose: supine({ legN: { u: -60, l: -20, f: -110 }, legF: { ik: [298, 194], bend: -1, f: 0 }, armN: { ik: [262, 136], bend: -1, h: 0 }, armF: { ik: [258, 138], bend: -1, h: 0 } }), hold: 1, move: 2, say: 'מגבת סביב כף הרגל, ברך כפופה' },
        { pose: supine({ legN: { u: -72, l: -72, f: -162 }, legF: { ik: [298, 194], bend: -1, f: 0 }, armN: { ik: [238, 128], bend: -1, h: 0 }, armF: { ik: [234, 130], bend: -1, h: 0 }, hl: [['thighTopN', 'kneeN']] }), hold: 3, move: 2, say: 'מיישרים את הברך עד מתיחה נעימה, בלי כאב', sayMove: 'מיישרים לאט' }
      ]
    },
    calf: {
      alt: 'ידיים על הקיר, רגל אחורית ישרה, עקב על הרצפה', face: -90, mat: false,
      props: (g, el) => { el('rect', { x: 92, y: 10, width: 10, height: 190, class: 'wall' }, g); },
      keys: [
        { pose: standing({ at: [190, 118], trunk: -100, neck: -100, armN: { ik: [106, 64], bend: -1, h: -90 }, armF: { ik: [106, 70], bend: -1, h: -90 }, legN: { ik: [156, 194], bend: -1, f: 180 }, legF: { ik: [256, 194], bend: -1, f: 172 } }), hold: 3, move: 2, say: 'גרסה 1: ברך אחורית ישרה, עקב על הרצפה', sayMove: 'מכופפים מעט את הברך האחורית' },
        { pose: standing({ at: [196, 128], trunk: -98, neck: -98, armN: { ik: [106, 72], bend: -1, h: -90 }, armF: { ik: [106, 78], bend: -1, h: -90 }, legN: { ik: [156, 194], bend: -1, f: 180 }, legF: { ik: [240, 194], bend: -1, f: 176 }, hl: [['calfF', 'ankleF']] }), hold: 3, move: 2, say: 'גרסה שנייה: מכופפים מעט את הברך האחורית, העקב נשאר למטה', sayMove: 'מכופפים מעט את הברך האחורית' }
      ]
    },
    catcow: {
      alt: 'עמידת שש, עיגול הגב כלפי מעלה ואז שקיעה עדינה', face: -90,
      keys: [
        { pose: quad({ bend: 7, neck: 210, fr: -95, hl: [['lowTrunk', 'upTrunk']] }), hold: 1, move: 2.2, say: 'חתול, בנשיפה: מעגלים בעדינות את הגב, הראש יורד' },
        { pose: quad({ bend: -4, neck: 178, fr: -84 }), hold: 1, move: 2.2, say: 'פרה, בשאיפה: הבטן שוקעת בעדינות, המבט עולה מעט', sayMove: 'לאט, בטווח נוח' }
      ]
    },
    shoulders: {
      alt: 'עמידה, גלגול כתפיים לאחור וקירוב שכמות', face: -90,
      keys: [
        { pose: standing({ sh: [0, 0] }), hold: .4, move: .7, say: 'עומדים זקוף, ידיים רפויות' },
        { pose: standing({ sh: [1, -11] }), hold: .1, move: .7, say: 'גלגול לאחור: מעלה' },
        { pose: standing({ sh: [10, -5], hl: [['upTrunk', 'chest']] }), hold: .2, move: .7, say: 'גלגול לאחור: אחורה, השכמות מתקרבות' },
        { pose: standing({ sh: [4, 3] }), hold: .1, move: .7, say: 'גלגול לאחור: מטה' },
        { pose: standing({ sh: [0, 0] }), hold: .4, move: .7, say: 'ועכשיו לכיוון השני' },
        { pose: standing({ sh: [-1, -11] }), hold: .1, move: .7, say: 'גלגול לפנים: מעלה' },
        { pose: standing({ sh: [-8, -4] }), hold: .1, move: .7, say: 'גלגול לפנים: קדימה' },
        { pose: standing({ sh: [-3, 3] }), hold: .1, move: .7, say: 'גלגול לפנים: מטה' }
      ]
    }
  };
  global.MOVES = MOVES;
})(window);
