import type { MarkedExtension, Token, Tokens } from 'marked';

/**
 * 깃허브 스타일 얼럿(admonition)을 marked에 얹는 확장.
 *
 * `> [!NOTE]` 처럼 인용의 첫 줄에 유형을 적으면 아이콘 + 색깔 제목이 붙은 강조 박스로 렌더한다.
 * 유형이 없는 인용은 평범한 blockquote 그대로 둔다. 깃허브가 지원하는 다섯 가지를 그대로 따른다:
 * Note / Tip / Important / Warning / Caution.
 *
 * 사용: `marked.use(githubAlertExtension())`
 */

type AlertType = 'note' | 'tip' | 'important' | 'warning' | 'caution';

const ALERT_LABEL: Record<AlertType, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

/* 깃허브와 동일한 옥티콘 아이콘(16px). fill=currentColor 라 유형별 제목 색을 그대로 따라간다. */
const ALERT_ICON: Record<AlertType, string> = {
  note: '<svg class="markdown-alert-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
  tip: '<svg class="markdown-alert-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>',
  important:
    '<svg class="markdown-alert-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  warning:
    '<svg class="markdown-alert-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  caution:
    '<svg class="markdown-alert-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.141.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
};

const ALERT_MARKER = /^\s*\[!(note|tip|important|warning|caution)\]/i;
const ALERT_STRIP = /^\s*\[!(?:note|tip|important|warning|caution)\]\s*/i;

/**
 * 인용 토큰 중 `[!TYPE]` 로 시작하는 것을 'alert' 토큰으로 바꾸고, 첫 줄의 마커 텍스트를 지운다.
 * Tokens.Generic 은 인덱스 시그니처가 있어 임의 속성(type/kind)을 타입 안전하게 얹을 수 있다.
 */
function tagAlertTokens(token: Token): void {
  if (token.type !== 'blockquote') return;
  // Token = MarkedToken | Tokens.Generic 이라 type 가드만으론 Blockquote로 좁혀지지 않는다
  const blockquote = token as Tokens.Blockquote;
  const match = ALERT_MARKER.exec(blockquote.text ?? '');
  if (!match) return;

  const firstParagraph = blockquote.tokens.find(
    (child): child is Tokens.Paragraph => child.type === 'paragraph',
  );

  const generic = token as Tokens.Generic;
  generic.type = 'alert';
  generic.kind = match[1].toLowerCase();

  if (!firstParagraph) return;
  firstParagraph.raw = firstParagraph.raw.replace(ALERT_STRIP, '');
  firstParagraph.text = firstParagraph.text.replace(ALERT_STRIP, '');
  const firstInline = firstParagraph.tokens?.[0];
  if (firstInline?.type === 'text') {
    const textToken = firstInline as Tokens.Text;
    textToken.raw = textToken.raw.replace(ALERT_STRIP, '');
    textToken.text = textToken.text.replace(ALERT_STRIP, '');
  }
}

/** `marked.use(...)` 에 넘길 확장 객체를 만든다. */
export function githubAlertExtension(): MarkedExtension {
  return {
    walkTokens: tagAlertTokens,
    extensions: [
      {
        name: 'alert',
        level: 'block',
        renderer(token) {
          const kind = token.kind as AlertType;
          const body = this.parser.parse(token.tokens ?? []);
          return (
            `<div class="markdown-alert markdown-alert-${kind}">` +
            `<p class="markdown-alert-title">${ALERT_ICON[kind]}<span>${ALERT_LABEL[kind]}</span></p>\n` +
            `${body}</div>\n`
          );
        },
      },
    ],
  };
}
