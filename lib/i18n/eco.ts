import type { Locale } from './LocaleContext'

/* ────────────────────────────────────────────────────────────────
   Copy de MARCA del ecosistema (Soberano de tu propia vida).
   Complementa las traducciones de landing en los 10 idiomas.
   Fuente: es (rioplatense). Fallback a es si faltara un idioma.
   Ver manifiesto_ecosistema_amauta + skill sistema-diseno-amauta.
   ──────────────────────────────────────────────────────────────── */

export type EcoPata = { dim: string; verbo: string; desc: string; cta: string }
export type EcoCopy = {
  eyebrow: string
  tagline: string
  espejo_q1: string
  espejo_hl: string
  espejo_q2: string
  espejo_sub: string
  pod_tag: string
  pod_h2: string
  pod_sub: string
  pod_here: string
  p: { libreria: EcoPata; libre: EcoPata; bienestar: EcoPata; cloud: EcoPata }
}

const ECO: Record<Locale, EcoCopy> = {
  es: {
    eyebrow: 'El poder de tu voluntad',
    tagline: 'Soberano de tu propia vida.',
    espejo_q1: 'Un barco a la deriva no sabe adónde va.',
    espejo_hl: 'Eso somos la mayoría.',
    espejo_q2: 'Si llevás control, lo que te queda por hacer es accionar.',
    espejo_sub: 'Libre no te va a cambiar la vida. Te muestra dónde estás parado para que la cambies vos.',
    pod_tag: 'Ecosistema Amauta',
    pod_h2: 'Libre es una de tus cuatro soberanías',
    pod_sub: 'Cada parte de vos tiene su herramienta. Cuatro poderes, una sola vida tuya.',
    pod_here: 'Estás acá',
    p: {
      libreria: { dim: 'MENTE', verbo: 'Aprendé', desc: 'Los libros como obras de arte. Nutrí lo que pensás.', cta: 'Ver la librería' },
      libre: { dim: 'VOLUNTAD', verbo: 'Accioná', desc: 'Hábitos, metas y finanzas. Ordená tu vida diaria.', cta: 'Estás usándolo' },
      bienestar: { dim: 'CUERPO', verbo: 'Fortalecéte', desc: 'Nutrición y energía para sostener todo lo demás.', cta: 'Conocer más' },
      cloud: { dim: 'OBRA', verbo: 'Multiplicáte', desc: 'Automatización con IA. Liberá tu trabajo.', cta: 'Ver servicios' },
    },
  },
  en: {
    eyebrow: 'The power of your will',
    tagline: 'Sovereign of your own life.',
    espejo_q1: 'A drifting boat has no idea where it’s going.',
    espejo_hl: 'That’s most of us.',
    espejo_q2: 'Once you’re in control, all that’s left is to act.',
    espejo_sub: 'Libre won’t change your life. It shows you where you stand so you can change it yourself.',
    pod_tag: 'Amauta Ecosystem',
    pod_h2: 'Libre is one of your four sovereignties',
    pod_sub: 'Every part of you has its tool. Four powers, one life — yours.',
    pod_here: 'You are here',
    p: {
      libreria: { dim: 'MIND', verbo: 'Learn', desc: 'Books as works of art. Feed what you think.', cta: 'Visit the bookstore' },
      libre: { dim: 'WILL', verbo: 'Act', desc: 'Habits, goals and finances. Order your daily life.', cta: 'You’re using it' },
      bienestar: { dim: 'BODY', verbo: 'Strengthen', desc: 'Nutrition and energy to sustain everything else.', cta: 'Learn more' },
      cloud: { dim: 'WORK', verbo: 'Multiply', desc: 'AI automation. Free up your work.', cta: 'See services' },
    },
  },
  pt: {
    eyebrow: 'O poder da sua vontade',
    tagline: 'Soberano da sua própria vida.',
    espejo_q1: 'Um barco à deriva não sabe para onde vai.',
    espejo_hl: 'É o que a maioria de nós é.',
    espejo_q2: 'Se você tem controle, só resta agir.',
    espejo_sub: 'O Libre não vai mudar a sua vida. Ele mostra onde você está para que você mesmo a mude.',
    pod_tag: 'Ecossistema Amauta',
    pod_h2: 'O Libre é uma das suas quatro soberanias',
    pod_sub: 'Cada parte de você tem a sua ferramenta. Quatro poderes, uma só vida: a sua.',
    pod_here: 'Você está aqui',
    p: {
      libreria: { dim: 'MENTE', verbo: 'Aprenda', desc: 'Os livros como obras de arte. Nutra o que você pensa.', cta: 'Ver a livraria' },
      libre: { dim: 'VONTADE', verbo: 'Aja', desc: 'Hábitos, metas e finanças. Organize o seu dia a dia.', cta: 'Você está usando' },
      bienestar: { dim: 'CORPO', verbo: 'Fortaleça-se', desc: 'Nutrição e energia para sustentar todo o resto.', cta: 'Saiba mais' },
      cloud: { dim: 'OBRA', verbo: 'Multiplique-se', desc: 'Automação com IA. Liberte o seu trabalho.', cta: 'Ver serviços' },
    },
  },
  fr: {
    eyebrow: 'Le pouvoir de ta volonté',
    tagline: 'Souverain de ta propre vie.',
    espejo_q1: 'Un bateau à la dérive ne sait pas où il va.',
    espejo_hl: 'C’est ce que nous sommes, pour la plupart.',
    espejo_q2: 'Quand tu as le contrôle, il ne te reste qu’à agir.',
    espejo_sub: 'Libre ne va pas changer ta vie. Il te montre où tu en es pour que tu la changes toi-même.',
    pod_tag: 'Écosystème Amauta',
    pod_h2: 'Libre est l’une de tes quatre souverainetés',
    pod_sub: 'Chaque partie de toi a son outil. Quatre pouvoirs, une seule vie : la tienne.',
    pod_here: 'Tu es ici',
    p: {
      libreria: { dim: 'ESPRIT', verbo: 'Apprends', desc: 'Les livres comme des œuvres d’art. Nourris ta pensée.', cta: 'Voir la librairie' },
      libre: { dim: 'VOLONTÉ', verbo: 'Agis', desc: 'Habitudes, objectifs et finances. Mets de l’ordre dans ton quotidien.', cta: 'Tu l’utilises' },
      bienestar: { dim: 'CORPS', verbo: 'Renforce-toi', desc: 'Nutrition et énergie pour soutenir tout le reste.', cta: 'En savoir plus' },
      cloud: { dim: 'ŒUVRE', verbo: 'Multiplie-toi', desc: 'Automatisation par IA. Libère ton travail.', cta: 'Voir les services' },
    },
  },
  zh: {
    eyebrow: '你意志的力量',
    tagline: '做自己人生的主人。',
    espejo_q1: '一艘随波漂流的船，不知道自己要去哪里。',
    espejo_hl: '我们大多数人，正是如此。',
    espejo_q2: '一旦你开始掌控，剩下要做的，只是行动。',
    espejo_sub: 'Libre 不会替你改变人生。它只是让你看清自己站在哪里，好让你亲手去改变。',
    pod_tag: 'Amauta 生态系统',
    pod_h2: 'Libre 只是你四大主权之一',
    pod_sub: '你的每一面都有专属的工具。四种力量，都属于你唯一的人生。',
    pod_here: '你在这里',
    p: {
      libreria: { dim: '心智', verbo: '学习', desc: '把书当作艺术品，滋养你的思想。', cta: '逛逛书店' },
      libre: { dim: '意志', verbo: '行动', desc: '习惯、目标与财务，整理你的日常生活。', cta: '你正在使用它' },
      bienestar: { dim: '身体', verbo: '强健', desc: '用营养与能量，撑起其余的一切。', cta: '了解更多' },
      cloud: { dim: '事业', verbo: '倍增', desc: '用 AI 实现自动化，解放你的工作。', cta: '查看服务' },
    },
  },
  hi: {
    eyebrow: 'तुम्हारी इच्छाशक्ति की ताकत',
    tagline: 'अपनी ज़िंदगी के मालिक बनो।',
    espejo_q1: 'बहती हुई नाव को नहीं पता वो कहाँ जा रही है।',
    espejo_hl: 'हम में से ज़्यादातर यही हैं।',
    espejo_q2: 'अगर तुम हिसाब रखते हो, तो बस करना बाकी रहता है।',
    espejo_sub: 'Libre तुम्हारी ज़िंदगी नहीं बदलेगा। वो तुम्हें दिखाता है कि तुम कहाँ खड़े हो, ताकि उसे तुम बदलो।',
    pod_tag: 'Amauta इकोसिस्टम',
    pod_h2: 'Libre तुम्हारे चार स्वराज में से एक है',
    pod_sub: 'तुम्हारे हर हिस्से के लिए एक औज़ार। चार ताक़तें, एक ही ज़िंदगी — तुम्हारी।',
    pod_here: 'तुम यहाँ हो',
    p: {
      libreria: { dim: 'मन', verbo: 'सीखो', desc: 'किताबें, कला की कृतियाँ। अपनी सोच को पोषण दो।', cta: 'पुस्तकालय देखो' },
      libre: { dim: 'इच्छाशक्ति', verbo: 'करो', desc: 'आदतें, लक्ष्य और वित्त। अपनी रोज़ की ज़िंदगी सँवारो।', cta: 'तुम इसे इस्तेमाल कर रहे हो' },
      bienestar: { dim: 'शरीर', verbo: 'मज़बूत बनो', desc: 'पोषण और ऊर्जा, बाक़ी सब कुछ थामे रखने के लिए।', cta: 'और जानो' },
      cloud: { dim: 'कर्म', verbo: 'कई गुना बनो', desc: 'AI से ऑटोमेशन। अपने काम को आज़ाद करो।', cta: 'सेवाएँ देखो' },
    },
  },
  ar: {
    eyebrow: 'قوة إرادتك',
    tagline: 'كن سيّد حياتك.',
    espejo_q1: 'قاربٌ تائه لا يعرف إلى أين يتجه.',
    espejo_hl: 'هكذا حال معظمنا.',
    espejo_q2: 'إن كنت تُمسك زمام الأمور، فكل ما يتبقّى هو أن تتحرّك.',
    espejo_sub: 'Libre لن يغيّر حياتك، بل يُريك أين تقف الآن لتغيّرها أنت بنفسك.',
    pod_tag: 'منظومة Amauta',
    pod_h2: 'Libre إحدى سياداتك الأربع',
    pod_sub: 'لكل جزء منك أداته. أربع قوى، وحياة واحدة هي حياتك.',
    pod_here: 'أنت هنا',
    p: {
      libreria: { dim: 'العقل', verbo: 'تعلّم', desc: 'الكتب بوصفها أعمالاً فنية. غذِّ فكرك.', cta: 'زُر المكتبة' },
      libre: { dim: 'الإرادة', verbo: 'تحرّك', desc: 'العادات والأهداف والمالية. نظّم حياتك اليومية.', cta: 'أنت تستخدمه الآن' },
      bienestar: { dim: 'الجسد', verbo: 'تقوّى', desc: 'تغذية وطاقة تسند كل ما سواها.', cta: 'اعرف المزيد' },
      cloud: { dim: 'العمل', verbo: 'تضاعف', desc: 'أتمتة بالذكاء الاصطناعي. حرّر عملك.', cta: 'استعرض الخدمات' },
    },
  },
  ru: {
    eyebrow: 'Сила твоей воли',
    tagline: 'Хозяин собственной жизни.',
    espejo_q1: 'Корабль без курса не знает, куда плывёт.',
    espejo_hl: 'Таково большинство из нас.',
    espejo_q2: 'Когда держишь всё под контролем, остаётся только действовать.',
    espejo_sub: 'Libre не изменит твою жизнь. Он показывает, где ты сейчас, чтобы ты изменил её сам.',
    pod_tag: 'Экосистема Amauta',
    pod_h2: 'Libre — одна из четырёх твоих сфер власти над собой',
    pod_sub: 'У каждой части тебя есть свой инструмент. Четыре силы — одна твоя жизнь.',
    pod_here: 'Ты здесь',
    p: {
      libreria: { dim: 'РАЗУМ', verbo: 'Учись', desc: 'Книги как произведения искусства. Питай свой разум.', cta: 'В книжный магазин' },
      libre: { dim: 'ВОЛЯ', verbo: 'Действуй', desc: 'Привычки, цели и финансы. Наведи порядок в своём дне.', cta: 'Ты уже пользуешься им' },
      bienestar: { dim: 'ТЕЛО', verbo: 'Укрепляйся', desc: 'Питание и энергия, чтобы поддерживать всё остальное.', cta: 'Узнать больше' },
      cloud: { dim: 'ДЕЛО', verbo: 'Умножайся', desc: 'Автоматизация с ИИ. Освободи свой труд.', cta: 'Посмотреть услуги' },
    },
  },
  id: {
    eyebrow: 'Kekuatan kemauanmu',
    tagline: 'Berdaulat atas hidupmu sendiri.',
    espejo_q1: 'Kapal yang terombang-ambing tak tahu ke mana tujuannya.',
    espejo_hl: 'Begitulah kebanyakan dari kita.',
    espejo_q2: 'Kalau kamu memegang kendali, yang tersisa hanyalah bertindak.',
    espejo_sub: 'Libre tak akan mengubah hidupmu. Ia menunjukkan di mana kamu berdiri, supaya kamu sendiri yang mengubahnya.',
    pod_tag: 'Ekosistem Amauta',
    pod_h2: 'Libre adalah salah satu dari empat kedaulatanmu',
    pod_sub: 'Setiap bagian dirimu punya alatnya. Empat kekuatan, satu hidup yang seutuhnya milikmu.',
    pod_here: 'Kamu di sini',
    p: {
      libreria: { dim: 'PIKIRAN', verbo: 'Belajar', desc: 'Buku sebagai karya seni. Beri gizi pada pikiranmu.', cta: 'Lihat toko buku' },
      libre: { dim: 'KEMAUAN', verbo: 'Bertindak', desc: 'Kebiasaan, tujuan, dan keuangan. Tata hidup harianmu.', cta: 'Kamu sedang memakainya' },
      bienestar: { dim: 'TUBUH', verbo: 'Kuatkan', desc: 'Nutrisi dan energi untuk menopang segala hal lainnya.', cta: 'Pelajari lebih lanjut' },
      cloud: { dim: 'KARYA', verbo: 'Lipatgandakan', desc: 'Otomatisasi dengan AI. Bebaskan pekerjaanmu.', cta: 'Lihat layanan' },
    },
  },
  ja: {
    eyebrow: 'あなたの意志の力',
    tagline: '自分の人生の主人であれ。',
    espejo_q1: '漂流する船は、行き先を知らない。',
    espejo_hl: '私たちの多くが、そうだ。',
    espejo_q2: '把握できていれば、あとは行動するだけだ。',
    espejo_sub: 'Libreがあなたの人生を変えるわけじゃない。今どこに立っているかを映し出す。変えるのは、あなた自身だ。',
    pod_tag: 'Amautaエコシステム',
    pod_h2: 'Libreは、あなたの四つの主権のひとつ',
    pod_sub: 'あなたのどの部分にも、それぞれの道具がある。四つの力、たったひとつのあなたの人生。',
    pod_here: '現在地',
    p: {
      libreria: { dim: '精神', verbo: '学ぶ', desc: '芸術品のような本。あなたの考えを養おう。', cta: '書店を見る' },
      libre: { dim: '意志', verbo: '行動する', desc: '習慣、目標、財務。毎日の生活を整えよう。', cta: '今使っています' },
      bienestar: { dim: '身体', verbo: '鍛える', desc: '他のすべてを支える、栄養とエネルギー。', cta: 'もっと知る' },
      cloud: { dim: '仕事', verbo: '増やす', desc: 'AIによる自動化。あなたの仕事を解放しよう。', cta: 'サービスを見る' },
    },
  },
}

export function getEco(locale: Locale): EcoCopy {
  return ECO[locale] ?? ECO.es
}
