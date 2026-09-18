/*
  Сборка трёх одиночных сайтов из сборного site-4-all/index.html.

  Запуск:  node build.js

  Нужен, только если вы правите ОФОРМЛЕНИЕ (движок, вёрстку, темы) и хотите,
  чтобы правка разошлась по всем сайтам. Для смены текстов и фотографий
  сборщик не нужен — они правятся прямо на странице кнопкой «Редактировать».

  Как это работает: в мастер-файле темы размечены комментариями
  /* @theme:noir *​/ ... /* @end *​/ — сборщик вырезает лишние темы,
  убирает переключатель и фиксирует тему по умолчанию.
*/

const fs = require('fs');
const path = require('path');

const ROOT   = __dirname;
const MASTER = path.join(ROOT, 'site-4-all', 'index.html');

const TARGETS = [
  { dir: 'site-1-warm',  theme: 'warm',
    intro: 'САЙТ ПАМЯТИ — дизайн №1 «Свет»\n  Тёплая архивная тема: кремовая бумага, портрет в паспарту,\n  буквица в биографии, лента событий на вертикальной оси.' },
  { dir: 'site-2-noir',  theme: 'noir',
    intro: 'САЙТ ПАМЯТИ — дизайн №2 «Ночь»\n  Кинематографичная тёмная тема: обложка во весь экран,\n  фотолента с прокруткой вбок, крупные цитаты.' },
  { dir: 'site-3-paper', theme: 'paper',
    intro: 'САЙТ ПАМЯТИ — дизайн №3 «Бумага»\n  Строгая типографика: белый лист, чёрно-белые снимки,\n  крупный титул, ассиметричная сетка галереи.' }
];

const HOWTO = `
  ДВА СПОСОБА ОБНОВИТЬ САЙТ
  ─────────────────────────
  1. ПРЯМО В БРАУЗЕРЕ (проще).
     Откройте страницу, нажмите «Редактировать» внизу справа.
     Тексты правятся по клику, у фото и видео — свои подписи,
     блоки добавляются, удаляются и переставляются кнопками.
     Когда закончите — «Сохранить файл»: браузер отдаст готовый
     index.html, положите его вместо старого. Всё, сайт обновлён.
     Правки не теряются: черновик хранится в браузере до сохранения.

  2. В ТЕКСТОВОМ РЕДАКТОРЕ.
     БЛОК 1 (сразу под этим комментарием) — все тексты, фото, видео.
     БЛОК 2 (палитра в <style>) — цвета и шрифты.

  ВНИМАНИЕ: этот файл собран из site-4-all/index.html командой  node build.js
  Правки оформления вносите в мастер-файл, иначе следующая сборка их сотрёт.
  Тексты и фотографии сборка не трогает — их правьте здесь как обычно.`;

/* вырезает блоки /* @theme:X *​/ ... /* @end *​/ для всех тем, кроме нужной */
function stripThemes(src, keep) {
  return src.replace(/\/\* @theme:(\w+) \*\/[\s\S]*?\/\* @end \*\/\n?/g,
    (block, name) => (name === keep ? block : ''));
}

/* вырезает переключатель тем: разметку и его стили */
function stripSwitcher(src) {
  return src
    .replace(/[ \t]*<!-- @switcher -->[\s\S]*?<!-- @end -->\n?/g, '')
    .replace(/\/\* @switcher-css \*\/[\s\S]*?\/\* @end \*\/\n?/g, '');
}

/* заменяет самый первый комментарий-шапку файла */
function replaceIntro(src, intro) {
  const a = src.indexOf('<!--');
  const b = src.indexOf('-->', a);
  const line = '='.repeat(78);
  const body = `<!--\n${line}\n  ${intro}\n  Всё в одном файле: данные + стили + скрипты.\n${HOWTO}\n\n  Блок данных одинаковый во всех четырёх сайтах — его можно\n  копировать между ними целиком.\n${line}\n-->`;
  return src.slice(0, a) + body + src.slice(b + 3);
}

const master = fs.readFileSync(MASTER, 'utf8');
let failed = false;

for (const t of TARGETS) {
  let out = master;
  out = stripThemes(out, t.theme);
  out = stripSwitcher(out);
  out = replaceIntro(out, t.intro);
  out = out.replace(/<body data-theme="[^"]*"/, `<body data-theme="${t.theme}"`);
  out = out.replace(/const DEFAULT_THEME = "[^"]*"/, `const DEFAULT_THEME = "${t.theme}"`);
  /* одиночный сайт всегда открывается в своей теме */
  out = out.replace(/^setTheme\(\(\(\)=>\{[\s\S]*?\)\(\)\);$/m, 'setTheme(DEFAULT_THEME);');

  /* оставшиеся правила чужих тем (одиночные строки вне размеченных блоков) */
  out = out.split('\n').filter(l => {
    const m = /^body[\w.\-]*\[data-theme="(\w+)"\]/.exec(l.trim());
    return !m || m[1] === t.theme;
  }).join('\n');

  /* проверки */
  const problems = [];
  for (const other of TARGETS.map(x => x.theme)) {
    if (other !== t.theme && out.includes(`data-theme="${other}"`))
      problems.push(`осталась разметка темы ${other}`);
  }
  if (out.includes('@switcher')) problems.push('остался переключатель');
  if (!out.includes('const DATA = {')) problems.push('потерян блок данных');
  if (problems.length) { failed = true; console.error(`✗ ${t.dir}: ${problems.join('; ')}`); continue; }

  const dest = path.join(ROOT, t.dir, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out, 'utf8');
  console.log(`✓ ${t.dir}/index.html — тема «${t.theme}», ${Math.round(out.length / 1024)} КБ`);
}

process.exit(failed ? 1 : 0);
