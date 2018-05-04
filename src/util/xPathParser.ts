// Ported from: https://github.com/128technology/xpathparser/blob/master/xpathparser.py

import * as _ from 'lodash';

type Token = string[];

// Not 100% XPath / XML, but good enough for YANG
const namestr = `[a-zA-Z_][a-zA-Z0-9_\\-.]*`;
const ncnamestr = `((${namestr}):)?(${namestr})`;
const prefixteststr = `((${namestr}'):)?\\*`;
const SPECIAL_TOKS = [
  ',',
  '@',
  '::',
  '(',
  '[',
  '/',
  '//',
  '|',
  '+',
  '-',
  '=',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'and',
  'or',
  'mod',
  'div'
];

const patterns: Array<[string, RegExp]> = [
  ['whitespace', /\s+/y],
  ['(', /\(/y],
  [')', /\)/y],
  ['[', /\[/y],
  [']', /\]/y],
  ['..', /\.\./y],
  ['.', /\./y],
  ['@', /\@/y],
  [',', /,/y],
  ['::', /::/y],
  ['//', /\/\//y],
  ['/', /\//y],
  ['|', /\|/y],
  ['+', /\+/y],
  ['-', /-/y],
  ['=', /=/y],
  ['!=', /!=/y],
  ['<=', /<=/y],
  ['>=', />=/y],
  ['>', />/y],
  ['<', /</y],
  ['*', /\*/y],
  ['number', /[0-9]+(\.[0-9]+)?/y],
  ['prefix-test', new RegExp(prefixteststr, 'y')],
  ['name', new RegExp(ncnamestr, 'y')],
  ['attribute', new RegExp(`\@${ncnamestr}`, 'y')],
  ['variable', new RegExp(`\$` + ncnamestr, 'y')],
  ['literal', /(\".*?\")|(\'.*?\')/y]
];

const operators = ['div', 'and', 'or', 'mod'];
const NODE_TYPES = ['comment', 'text', 'processing-instruction', 'node'];
const axes = [
  'ancestor-or-self',
  'ancestor',
  'attribute',
  'child',
  'descendant-or-self',
  'descendant',
  'following-sibling',
  'following',
  'namespace',
  'parent',
  'preceding-sibling',
  'preceding',
  'self'
];

const openParenRegExp = /\s*\(/y;
const axisRegExp = /\s*::/y;

function match(regexp: RegExp, s: string, pos: number) {
  regexp.lastIndex = pos;
  const result = regexp.exec(s);
  regexp.lastIndex = 0;

  return result;
}

function getPrecedingToken(toks: Token[]) {
  const len = toks.length;

  if (len > 1 && toks[len - 1][0] === 'whitespace') {
    return toks[len - 2][0];
  }

  if (len > 0 && toks[len - 1][0] !== 'whitespace') {
    return toks[len - 1][0];
  }

  return null;
}

function isSpecial(tok: string) {
  return SPECIAL_TOKS.indexOf(tok) !== -1;
}

/**
 * Return a list of tokens, or throw SyntaxError on failure.
 * A token is one of the patterns or:
 *   ('wildcard', '*')
 *   ('axis', axisname)
 */
export function tokens(s: string) {
  let pos = 0;
  const toks = [];

  while (pos < s.length) {
    let matched = false;
    for (const pattern of patterns) {
      const [tokname, r] = pattern;
      const m = match(r, s, pos);

      if (!_.isNil(m)) {
        let tok;
        const prec = getPrecedingToken(toks);
        if (tokname === '*' && !_.isNil(prec) && isSpecial(prec)) {
          // XPath 1.0 spec, 3.7 special rule 1a
          // interpret '*' as a wildcard
          tok = ['wildcard', m[0]];
        } else if (tokname === 'name' && !_.isNil(prec) && !isSpecial(prec) && operators.indexOf(m[0]) !== -1) {
          // XPath 1.0 spec, 3.7 special rule 1b
          // interpret the name as an operator
          tok = [m[0], m[0]];
        } else if (tokname === 'name') {
          // check if next token is '('
          if (match(openParenRegExp, s, pos + m[0].length)) {
            // XPath 1.0 spec, 3.7 special rule 2
            if (NODE_TYPES.indexOf(m[0]) !== -1) {
              // XPath 1.0 spec, 3.7 special rule 2a
              tok = [m[0], m[0]];
            } else {
              // XPath 1.0 spec, 3.7 special rule 2b
              tok = ['function', m[0]];
            }
            // check if next token is '::'
          } else if (match(axisRegExp, s, pos + m[0].length)) {
            // XPath 1.0 spec, 3.7 special rule 3
            if (axes.indexOf(m[0]) !== -1) {
              tok = ['axis', m[0]];
            } else {
              throw new Error(`Unknown axis: ${pos + 1}, ${m[0]}`);
            }
          } else {
            tok = ['name', m[0]];
          }
        } else {
          tok = [tokname, m[0]];
        }
        pos += m[0].length;
        toks.push(tok);
        matched = true;
        break;
      }
    }

    if (matched === false) {
      throw new Error(`Syntax error at position ${pos + 1}`);
    }
  }

  return toks;
}
