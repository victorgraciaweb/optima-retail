import { BadRequestException } from '@nestjs/common';

/**
 * Boolean query parser: user syntax -> PostgreSQL `tsquery` string.
 *
 * Hand-rolled instead of `websearch_to_tsquery` because the assignment requires
 * nested parentheses and `*` wildcards, neither of which that function supports.
 *
 * Security: the emitted tsquery is built only from tokens this module produces,
 * and every lexeme is single-quoted with internal quotes doubled. User input can
 * therefore never introduce tsquery operators, and malformed input is rejected
 * here (400) instead of reaching PostgreSQL as a syntax error (500).
 */

const MAX_INPUT_LENGTH = 512;
const MAX_TOKENS = 64;
const MAX_DEPTH = 10;

type Token =
  | { type: 'LPAREN' }
  | { type: 'RPAREN' }
  | { type: 'AND' }
  | { type: 'OR' }
  | { type: 'NOT' }
  | { type: 'TERM'; word: string; prefix: boolean }
  | { type: 'PHRASE'; words: string[] };

type Node =
  | { type: 'term'; word: string; prefix: boolean }
  | { type: 'phrase'; words: string[] }
  | {
      type: 'binary';
      op: 'AND' | 'OR';
      left: Node;
      right: Node;
      negateRight: boolean;
    };

/**
 * Word characters are everything that is not a separator. Keeping this as a
 * negated class (instead of an allow-list) preserves non-latin scripts present
 * in the sample data (Arabic, Chinese) while still stripping every character
 * that carries meaning in the tsquery grammar.
 */
const isSeparator = (char: string): boolean => /[\s"()*&|!:<>'\\]/.test(char);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    if (tokens.length > MAX_TOKENS) {
      throw new BadRequestException(
        `Query is too complex (maximum ${MAX_TOKENS} tokens)`,
      );
    }

    const char = input[index];

    if (/\s/.test(char)) {
      index++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      index++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      index++;
      continue;
    }

    if (char === '"') {
      const closing = input.indexOf('"', index + 1);

      if (closing === -1) {
        throw new BadRequestException('Unterminated quoted phrase');
      }

      const words = input
        .slice(index + 1, closing)
        .split(/[\s"()*&|!:<>'\\]+/)
        .filter((word) => word.length > 0);

      if (words.length === 0) {
        throw new BadRequestException('Empty quoted phrase');
      }

      tokens.push({ type: 'PHRASE', words });
      index = closing + 1;
      continue;
    }

    // Standalone `*` or any other separator outside a word carries no meaning.
    if (isSeparator(char)) {
      index++;
      continue;
    }

    let end = index;
    while (end < input.length && !isSeparator(input[end])) {
      end++;
    }

    const word = input.slice(index, end);
    // Only a trailing `*` is a wildcard, and it must sit right after the word.
    const prefix = input[end] === '*';
    index = prefix ? end + 1 : end;

    if (word === 'AND') {
      tokens.push({ type: 'AND' });
    } else if (word === 'OR') {
      tokens.push({ type: 'OR' });
    } else if (word === 'NOT') {
      tokens.push({ type: 'NOT' });
    } else {
      tokens.push({ type: 'TERM', word, prefix });
    }
  }

  return tokens;
}

class Parser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.parseOr(0);

    if (this.position < this.tokens.length) {
      throw new BadRequestException('Unbalanced parentheses in query');
    }

    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private parseOr(depth: number): Node {
    let left = this.parseAnd(depth);

    while (this.peek()?.type === 'OR') {
      this.position++;
      const right = this.parseAnd(depth);
      left = { type: 'binary', op: 'OR', left, right, negateRight: false };
    }

    return left;
  }

  private parseAnd(depth: number): Node {
    let left = this.parseUnary(depth);

    for (;;) {
      const token = this.peek();

      if (!token || token.type === 'OR' || token.type === 'RPAREN') {
        return left;
      }

      let negateRight = false;

      if (token.type === 'AND') {
        this.position++;

        if (this.peek()?.type === 'NOT') {
          this.position++;
          negateRight = true;
        }
      } else if (token.type === 'NOT') {
        throw new BadRequestException(
          'NOT must be preceded by AND (use "AND NOT")',
        );
      }
      // No operator between operands: implicit AND, so `oil and gas` treats the
      // lowercase `and` as a search term rather than failing to parse.

      const right = this.parseUnary(depth);
      left = { type: 'binary', op: 'AND', left, right, negateRight };
    }
  }

  private parseUnary(depth: number): Node {
    if (depth > MAX_DEPTH) {
      throw new BadRequestException(
        `Query nesting is too deep (maximum ${MAX_DEPTH} levels)`,
      );
    }

    const token = this.peek();

    if (!token) {
      throw new BadRequestException('Unexpected end of query');
    }

    if (token.type === 'LPAREN') {
      this.position++;
      const node = this.parseOr(depth + 1);

      if (this.peek()?.type !== 'RPAREN') {
        throw new BadRequestException('Unbalanced parentheses in query');
      }

      this.position++;
      return node;
    }

    if (token.type === 'TERM') {
      this.position++;
      return { type: 'term', word: token.word, prefix: token.prefix };
    }

    if (token.type === 'PHRASE') {
      this.position++;
      return { type: 'phrase', words: token.words };
    }

    throw new BadRequestException(`Unexpected "${token.type}" in query`);
  }
}

const quote = (word: string): string => `'${word.replaceAll("'", "''")}'`;

function emit(node: Node): string {
  switch (node.type) {
    case 'term':
      return node.prefix ? `${quote(node.word)}:*` : quote(node.word);

    case 'phrase':
      return node.words.length === 1
        ? quote(node.words[0])
        : `(${node.words.map(quote).join(' <-> ')})`;

    case 'binary': {
      const operator = node.op === 'OR' ? '|' : '&';
      const right = node.negateRight
        ? `!${emit(node.right)}`
        : emit(node.right);

      return `(${emit(node.left)} ${operator} ${right})`;
    }
  }
}

/**
 * @throws BadRequestException when the query is malformed or exceeds the guardrails
 */
export function parseBooleanQuery(input: string): string {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new BadRequestException(
      `Query is too long (maximum ${MAX_INPUT_LENGTH} characters)`,
    );
  }

  const tokens = tokenize(input);

  if (tokens.length === 0) {
    throw new BadRequestException('Query contains no searchable terms');
  }

  return emit(new Parser(tokens).parse());
}
