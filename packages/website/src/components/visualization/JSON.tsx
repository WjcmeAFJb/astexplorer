import JSONEditor, { type JSONHighlight } from '../JSONEditor';
import React from 'react';

const globalJSON = globalThis.JSON;

/**
 * Serialize a value to pretty-printed JSON, tracking character offsets for
 * any node whose range (derived from start/end or range fields) appears in
 * `cursorRanges`. Safe against cycles.
 *
 * Mirrors the shape of JSON.stringify(value, null, 2) for normal values.
 */
function stringifyWithPositions(
  value: unknown,
  cursorRanges: Set<string>,
): { text: string; highlights: JSONHighlight[] } {
  const space = 2;
  const highlights: JSONHighlight[] = [];
  const seen = new WeakSet<object>();
  let out = '';

  function indent(depth: number): string {
    return ' '.repeat(depth * space);
  }

  function emit(s: string): void {
    out += s;
  }

  function nodeRangeKey(v: object): string | null {
    const rec = v as Record<string, unknown>;
    if (
      Array.isArray(rec.range) &&
      typeof rec.range[0] === 'number' &&
      typeof rec.range[1] === 'number'
    ) {
      return `${rec.range[0]}:${rec.range[1]}`;
    }
    if (typeof rec.start === 'number' && typeof rec.end === 'number') {
      return `${rec.start}:${rec.end}`;
    }
    return null;
  }

  function serialize(v: unknown, depth: number): void {
    if (v === null || v === undefined) {
      emit('null');
      return;
    }
    const t = typeof v;
    if (t === 'number') {
      emit(Number.isFinite(v) ? String(v) : 'null');
      return;
    }
    if (t === 'boolean') {
      emit(String(v));
      return;
    }
    if (t === 'string') {
      emit(globalJSON.stringify(v));
      return;
    }
    if (t === 'bigint') {
      emit(globalJSON.stringify(String(v)));
      return;
    }
    if (t === 'function') {
      emit('null');
      return;
    }
    if (t !== 'object') {
      emit('null');
      return;
    }

    const obj = v as object;
    if (seen.has(obj)) {
      emit('"[Circular]"');
      return;
    }
    seen.add(obj);

    const key = nodeRangeKey(obj);
    const isTarget = key !== null && cursorRanges.has(key);
    const start = out.length;

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        emit('[]');
      } else {
        emit('[\n');
        for (let i = 0; i < obj.length; i++) {
          emit(indent(depth + 1));
          serialize(obj[i], depth + 1);
          if (i < obj.length - 1) emit(',');
          emit('\n');
        }
        emit(indent(depth) + ']');
      }
    } else {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        emit('{}');
      } else {
        emit('{\n');
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          emit(indent(depth + 1));
          emit(globalJSON.stringify(k));
          emit(': ');
          serialize((obj as Record<string, unknown>)[k], depth + 1);
          if (i < keys.length - 1) emit(',');
          emit('\n');
        }
        emit(indent(depth) + '}');
      }
    }

    const end = out.length;
    if (isTarget) {
      highlights.push({ start, end });
    }
  }

  try {
    serialize(value, 0);
  } catch {
    return { text: String(value), highlights: [] };
  }

  return { text: out, highlights };
}

type JSONViewProps = {
  parseResult: { ast: unknown };
  cursorRanges?: Set<string>;
};

export default function JSON({ parseResult, cursorRanges }: JSONViewProps): React.ReactElement {
  const ranges = cursorRanges ?? new Set<string>();
  const { text, highlights } = React.useMemo(
    () => stringifyWithPositions(parseResult.ast, ranges),
    [parseResult.ast, ranges],
  );
  return <JSONEditor className="container" value={text} highlights={highlights} />;
}
