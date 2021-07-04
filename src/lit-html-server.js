/**
 * Collection of shared utilities used by directives.
 * Manually added to ensure that directives can be used by both index.js and browser.js
 */

/**
 * A value for parts that signals a Part to clear its content
 */
const nothing = '__nothing-lit-html-server-string__';

/**
 * A prefix value for strings that should not be escaped
 */
const unsafePrefixString = '__unsafe-lit-html-server-string__';

/**
 * Determine if "part" is a NodePart
 *
 * @param { unknown } part
 * @returns { part is NodePart }
 */
function isNodePart(part) {
  // @ts-ignore
  return part && part.getValue !== undefined && !('name' in part);
}

/**
 * Determine if "part" is an AttributePart
 *
 * @param { unknown } part
 * @returns { part is AttributePart }
 */
function isAttributePart(part) {
  // @ts-ignore
  return part && part.getValue !== undefined && 'name' in part;
}

/**
 * Determine if "value" is a primitive
 *
 * @param { unknown } value
 * @returns { value is null|string|boolean|number }
 */
function isPrimitive(value) {
  const type = typeof value;

  return value === null || !(type === 'object' || type === 'function');
}

/**
 * Determine if "obj" is a directive function
 *
 * @param { unknown } fn
 * @returns { fn is Function }
 */
function isDirective(fn) {
  // @ts-ignore
  return typeof fn === 'function' && fn.isDirective;
}

/**
 * Determine whether "result" is a TemplateResult
 *
 * @param { unknown } result
 * @returns { result is TemplateResult }
 */
function isTemplateResult(result) {
  // @ts-ignore
  return result && typeof result.template !== 'undefined' && typeof result.values !== 'undefined';
}

/**
 * Determine if "iterator" is an synchronous iterator
 *
 * @param { unknown } iterator
 * @returns { iterator is IterableIterator<unknown> }
 */
function isSyncIterator(iterator) {
  return (
    iterator != null &&
    // Ignore strings (which are also iterable)
    typeof iterator !== 'string' &&
    // @ts-ignore
    typeof iterator[Symbol.iterator] === 'function'
  );
}

/**
 * Determine if "value" is an object
 *
 * @param { unknown } value
 * @returns { value is object }
 */
function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Determine if "value" is a Buffer
 *
 * @param { unknown } value
 * @returns { value is Buffer }
 */
function isBuffer(value) {
  return Buffer.isBuffer(value);
}

/**
 * Determine if "value" is an Array
 *
 * @param { unknown } value
 * @returns { value is Array }
 */
function isArray(value) {
  return Array.isArray(value);
}

// https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#output-encoding-rules-summary
// https://github.com/mathiasbynens/jsesc/blob/master/jsesc.js

/** @type { { [name: string]: string } } */
const HTML_ESCAPES = {
  '"': '&quot;',
  "'": '&#x27;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};
const RE_HTML = /["'&<>]/g;
const RE_SCRIPT_STYLE_TAG = /<\/(script|style)/gi;

/**
 * Safely escape "string" for inlining
 *
 * @param { string } string
 * @param { string } context - one of text|attribute|script|style
 * @returns { string }
 */
function escape(string, context = 'text') {
  switch (context) {
    case 'script':
    case 'style':
      return string.replace(RE_SCRIPT_STYLE_TAG, '<\\/$1').replace(/<!--/g, '\\x3C!--');
    case 'attribute':
    case 'text':
    default:
      return string.replace(RE_HTML, (match) => HTML_ESCAPES[match]);
  }
}

const EMPTY_STRING_BUFFER = Buffer.from('');

/**
 * Base class interface for Node/Attribute parts
 */
class Part {
  /**
   * Constructor
   *
   * @param { string } tagName
   */
  constructor(tagName) {
    this.tagName = tagName;
    this._value;
  }

  /**
   * Store the current value.
   * Used by directives to temporarily transfer value
   * (value will be deleted after reading).
   *
   * @param { any } value
   */
  setValue(value) {
    this._value = value;
  }

  /**
   * Retrieve resolved string from passed "value"
   *
   * @param { any } value
   * @param { RenderOptions } [options]
   * @returns { any }
   */
  getValue(value, options) {
    return value;
  }

  /**
   * No-op
   */
  commit() {}
}

/**
 * A dynamic template part for text nodes
 */
class NodePart extends Part {
  /**
   * Retrieve resolved value given passed "value"
   *
   * @param { any } value
   * @param { RenderOptions } [options]
   * @returns { any }
   */
  getValue(value, options) {
    return resolveNodeValue(value, this);
  }
}

/**
 * A dynamic template part for attributes.
 * Unlike text nodes, attributes may contain multiple strings and parts.
 */
class AttributePart extends Part {
  /**
   * Constructor
   *
   * @param { string } name
   * @param { Array<Buffer> } strings
   * @param { string } tagName
   */
  constructor(name, strings, tagName) {
    super(tagName);
    this.name = name;
    this.strings = strings;
    this.length = strings.length - 1;
    this.prefix = Buffer.from(`${this.name}="`);
    this.suffix = Buffer.from(`${this.strings[this.length]}"`);
  }

  /**
   * Retrieve resolved string Buffer from passed "values".
   * Resolves to a single string, or Promise for a single string,
   * even when responsible for multiple values.
   *
   * @param { Array<unknown> } values
   * @param { RenderOptions } [options]
   * @returns { Buffer | Promise<Buffer> }
   */
  getValue(values, options) {
    let chunks = [this.prefix];
    let chunkLength = this.prefix.length;
    let pendingChunks;

    for (let i = 0; i < this.length; i++) {
      const string = this.strings[i];
      let value = resolveAttributeValue(values[i], this, options !== undefined ? options.serializePropertyAttributes : false);

      // Bail if 'nothing'
      if (value === nothing) {
        return EMPTY_STRING_BUFFER;
      }

      chunks.push(string);
      chunkLength += string.length;

      if (isBuffer(value)) {
        chunks.push(value);
        chunkLength += value.length;
      } else if (isArray(value)) {
        for (const chunk of value) {
          chunks.push(chunk);
          chunkLength += chunk.length;
        }
      }
    }

    chunks.push(this.suffix);
    chunkLength += this.suffix.length;
    if (pendingChunks !== undefined) {
      return Promise.all(pendingChunks).then(() => Buffer.concat(chunks, chunkLength));
    }
    return Buffer.concat(chunks, chunkLength);
  }
}

/**
 * A dynamic template part for boolean attributes.
 * Boolean attributes are prefixed with "?"
 */
class BooleanAttributePart extends AttributePart {
  /**
   * Constructor
   *
   * @param { string } name
   * @param { Array<Buffer> } strings
   * @param { string } tagName
   * @throws error when multiple expressions
   */
  constructor(name, strings, tagName) {
    super(name, strings, tagName);

    this.nameAsBuffer = Buffer.from(this.name);

    if (strings.length !== 2 || strings[0] === EMPTY_STRING_BUFFER || strings[1] === EMPTY_STRING_BUFFER) {
      throw Error('Boolean attributes can only contain a single expression');
    }
  }

  /**
   * Retrieve resolved string Buffer from passed "values".
   *
   * @param { Array<unknown> } values
   * @param { RenderOptions } [options]
   * @returns { Buffer | Promise<Buffer> }
   */
  getValue(values, options) {
    let value = values[0];

    if (isDirective(value)) {
      value = resolveDirectiveValue(value, this);
    }

    return value ? this.nameAsBuffer : EMPTY_STRING_BUFFER;
  }
}

/**
 * A dynamic template part for property attributes.
 * Property attributes are prefixed with "."
 */
class PropertyAttributePart extends AttributePart {
  /**
   * Retrieve resolved string Buffer from passed "values".
   * Returns an empty string unless "options.serializePropertyAttributes=true"
   *
   * @param { Array<unknown> } values
   * @param { RenderOptions } [options]
   * @returns { Buffer | Promise<Buffer> }
   */
  getValue(values, options) {
    if (options !== undefined && options.serializePropertyAttributes) {
      const value = super.getValue(values, options);
      const prefix = Buffer.from('.');

      return Buffer.concat([prefix, value]);
    }

    return EMPTY_STRING_BUFFER;
  }
}

/**
 * A dynamic template part for event attributes.
 * Event attributes are prefixed with "@"
 */
class EventAttributePart extends AttributePart {
  /**
   * Retrieve resolved string Buffer from passed "values".
   * Event bindings have no server-side representation,
   * so always returns an empty string.
   *
   * @param { Array<unknown> } values
   * @param { RenderOptions } [options]
   * @returns { Buffer }
   */
  getValue(values, options) {
    return EMPTY_STRING_BUFFER;
  }
}

/**
 * Resolve "value" to string if possible
 *
 * @param { unknown } value
 * @param { AttributePart } part
 * @param { boolean } [serialiseObjectsAndArrays]
 * @returns { any }
 */
function resolveAttributeValue(value, part, serialiseObjectsAndArrays = false) {
  if (isDirective(value)) {
    value = resolveDirectiveValue(value, part);
  }

  if (value === nothing) {
    return value;
  }

  if (isPrimitive(value)) {
    const string = typeof value !== 'string' ? String(value) : value;
    // Escape if not prefixed with unsafePrefixString, otherwise strip prefix
    return Buffer.from(string.indexOf(unsafePrefixString) === 0 ? string.slice(33) : escape(string, 'attribute'));
  } else if (typeof value === 'object') {
    return Buffer.from(JSON.stringify(value).replace(/"/g, `'`));
  } else if (isBuffer(value)) {
    return value;
  } else if (serialiseObjectsAndArrays && (isObject(value) || isArray(value))) {
    return Buffer.from(escape(JSON.stringify(value), 'attribute'));
  } else if (isSyncIterator(value)) {
    if (!isArray(value)) {
      value = Array.from(value);
    }
    return Buffer.concat(
      // @ts-ignore: already converted to Array
      value.reduce((values, value) => {
        value = resolveAttributeValue(value, part, serialiseObjectsAndArrays);
        // Flatten
        if (isArray(value)) {
          return values.concat(value);
        }
        values.push(value);
        return values;
      }, []),
    );
  } else {
    return Buffer.from(String(value));
  }
}

/**
 * Resolve "value" to string Buffer if possible
 *
 * @param { unknown } value
 * @param { NodePart } part
 * @returns { any }
 */
function resolveNodeValue(value, part) {
  if (isDirective(value)) {
    value = resolveDirectiveValue(value, part);
  }

  if (value === nothing || value === undefined) {
    return EMPTY_STRING_BUFFER;
  }

  if (isPrimitive(value)) {
    const string = typeof value !== 'string' ? String(value) : value;
    // Escape if not prefixed with unsafePrefixString, otherwise strip prefix
    return Buffer.from(
      string.indexOf(unsafePrefixString) === 0
        ? string.slice(33)
        : escape(string, part.tagName === 'script' || part.tagName === 'style' ? part.tagName : 'text'),
    );
  } else if (isTemplateResult(value) || isBuffer(value)) {
    return value;
  } else if (isSyncIterator(value)) {
    if (!isArray(value)) {
      value = Array.from(value);
    }
    // @ts-ignore: already converted to Array
    return value.reduce((values, value) => {
      value = resolveNodeValue(value, part);
      // Flatten
      if (isArray(value)) {
        return values.concat(value);
      }
      values.push(value);
      return values;
    }, []);
  } else {
    throw Error(`unknown NodePart value: ${value}`);
  }
}

/**
 * Resolve values of async "iterator"
 *
 * @param { AsyncIterable<unknown> } iterator
 * @param { NodePart } part
 * @returns { AsyncGenerator }
 */
async function* resolveAsyncIteratorValue(iterator, part) {
  for await (const value of iterator) {
    yield resolveNodeValue(value, part);
  }
}

/**
 * Resolve value of "directive"
 *
 * @param { function } directive
 * @param { Part } part
 * @returns { unknown }
 */
function resolveDirectiveValue(directive, part) {
  // Directives are synchronous, so it's safe to read and delete value
  directive(part);
  const value = part._value;
  part._value = undefined;
  return value;
}

/**
 * Class representing the default Template processor.
 * Exposes factory functions for generating Part instances to use for
 * resolving a template's dynamic values.
 */
class DefaultTemplateProcessor {
  /**
   * Create part instance for dynamic attribute values
   *
   * @param { string } name
   * @param { Array<Buffer> } strings
   * @param { string } tagName
   * @returns { AttributePart }
   */
  handleAttributeExpressions(name, strings = [], tagName) {
    const prefix = name[0];

    if (prefix === '.') {
      return new PropertyAttributePart(name.slice(1), strings, tagName);
    } else if (prefix === '@') {
      return new EventAttributePart(name.slice(1), strings, tagName);
    } else if (prefix === '?') {
      return new BooleanAttributePart(name.slice(1), strings, tagName);
    }

    return new AttributePart(name, strings, tagName);
  }

  /**
   * Create part instance for dynamic text values
   *
   * @param { string } tagName
   * @returns { NodePart }
   */
  handleTextExpression(tagName) {
    return new NodePart(tagName);
  }
}

/* eslint no-constant-condition:0 */

/**
 * Class for the default TemplateResult processor
 * used by Promise/Stream TemplateRenderers.
 *
 * @implements TemplateResultProcessor
 */
class DefaultTemplateResultProcessor {
  /**
   * Process "stack" and push chunks to "renderer"
   *
   * @param { TemplateResultRenderer } renderer
   * @param { Array<unknown> } stack
   * @param { number } [highWaterMark] - byte length to buffer before pushing data
   * @param { RenderOptions } [options]
   * @returns { () => void }
   */
  getProcessor(renderer, stack, highWaterMark = 0, options) {
    /** @type { Array<Buffer> } */
    const buffer = [];
    let bufferLength = 0;
    let processing = false;

    function flushBuffer() {
      if (buffer.length > 0) {
        const keepPushing = renderer.push(Buffer.concat(buffer, bufferLength));

        bufferLength = buffer.length = 0;
        return keepPushing;
      }
    }

    return function process() {
      if (processing) {
        return;
      }

      while (true) {
        processing = true;
        let chunk = stack[0];
        let breakLoop = false;
        let popStack = true;

        // Done
        if (chunk === undefined) {
          flushBuffer();
          return renderer.push(null);
        }

        if (isTemplateResult(chunk)) {
          popStack = false;
          chunk = getTemplateResultChunk(chunk, stack, options);
        }

        // Skip if finished reading TemplateResult (null)
        if (chunk !== null) {
          if (isBuffer(chunk)) {
            buffer.push(chunk);
            bufferLength += chunk.length;
            // Flush buffered data if over highWaterMark
            if (bufferLength > highWaterMark) {
              // Break if backpressure triggered
              breakLoop = !flushBuffer();
              processing = !breakLoop;
            }
          } else if (isArray(chunk)) {
            // First remove existing Array if at top of stack (not added by pending TemplateResult)
            if (stack[0] === chunk) {
              popStack = false;
              stack.shift();
            }
            stack.unshift(...chunk);
          } else {
            stack.length = 0;
            return renderer.destroy(Error(`unknown chunk type: ${chunk}`));
          }
        }

        if (popStack) {
          stack.shift();
        }

        if (breakLoop) {
          break;
        }
      }
    };
  }
}

/**
 * Retrieve next chunk from "result".
 * Adds nested TemplateResults to the stack if necessary.
 *
 * @param { TemplateResult } result
 * @param { Array<unknown> } stack
 * @param { RenderOptions } [options]
 */
function getTemplateResultChunk(result, stack, options) {
  let chunk = result.readChunk(options);

  // Skip empty strings
  if (isBuffer(chunk) && chunk.length === 0) {
    chunk = result.readChunk(options);
  }

  // Finished reading, dispose
  if (chunk === null) {
    stack.shift();
  } else if (isTemplateResult(chunk)) {
    // Add to top of stack
    stack.unshift(chunk);
    chunk = getTemplateResultChunk(chunk, stack, options);
  }

  return chunk;
}

/**
 * A factory for rendering a template result to a string resolving Promise
 *
 * @param { TemplateResult } result
 * @param { TemplateResultProcessor } processor
 * @param { boolean } [asBuffer]
 * @param { RenderOptions } [options]
 */
function promiseTemplateRenderer(result, processor, asBuffer = false, options) {
  return new Promise((resolve, reject) => {
    let stack = [result];
    /** @type { Array<Buffer> } */
    let buffer = [];
    let bufferLength = 0;

    processor.getProcessor(
      {
        push(chunk) {
          if (chunk === null) {
            const concatBuffer = Buffer.concat(buffer, bufferLength);
            resolve(asBuffer ? concatBuffer : concatBuffer.toString());
          } else {
            buffer.push(chunk);
            bufferLength += chunk.length;
          }
          return true;
        },
        destroy(err) {
          buffer.length = stack.length = bufferLength = 0;
          // @ts-ignore
          buffer = undefined;
          // @ts-ignore
          stack = undefined;
          reject(err);
        },
      },
      stack,
      0,
      options,
    )();
  });
}

/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex =
  // eslint-disable-next-line no-control-regex
  /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

const EMPTY_STRING_BUFFER$1 = Buffer.from('');
const RE_QUOTE = /"[^"]*|'[^']*$/;
/* eslint no-control-regex: 0 */
const RE_TAG_NAME = /[a-zA-Z0-9._-]/;
const TAG_OPEN = 1;
const TAG_CLOSED = 0;
const TAG_NONE = -1;

/**
 * A cacheable Template that stores the "strings" and "parts" associated with a
 * tagged template literal invoked with "html`...`".
 */
class Template {
  /**
   * Create Template instance
   *
   * @param { TemplateStringsArray } strings
   * @param { TemplateProcessor } processor
   */
  constructor(strings, processor) {
    this.strings = [];
    this.parts = [];
    this._prepare(strings, processor);
  }

  /**
   * Prepare the template's static strings,
   * and create Part instances for the dynamic values,
   * based on lit-html syntax.
   *
   * @param { TemplateStringsArray } strings
   * @param { TemplateProcessor } processor
   */
  _prepare(strings, processor) {
    const endIndex = strings.length - 1;
    let attributeMode = false;
    let nextString = strings[0];
    let tagName = '';

    for (let i = 0; i < endIndex; i++) {
      let string = nextString;
      nextString = strings[i + 1];
      const [tagState, tagStateIndex] = getTagState(string);
      let skip = 0;
      let part;

      // Open/close tag found at end of string
      if (tagState !== TAG_NONE) {
        attributeMode = tagState !== TAG_CLOSED;
        // Find tag name if open, or if closed and no existing tag name
        if (tagState === TAG_OPEN || tagName === '') {
          tagName = getTagName(string, tagState, tagStateIndex);
        }
      }

      if (attributeMode) {
        const matchName = lastAttributeNameRegex.exec(string);

        if (matchName) {
          let [, prefix, name, suffix] = matchName;

          // Since attributes are conditional, remove "name" and "suffix" from static string
          string = string.slice(0, matchName.index + prefix.length);

          const matchQuote = RE_QUOTE.exec(suffix);

          // If attribute is quoted, handle potential multiple values
          if (matchQuote) {
            const quoteCharacter = matchQuote[0].charAt(0);
            // Store any text between quote character and value
            const attributeStrings = [Buffer.from(suffix.slice(matchQuote.index + 1))];
            let open = true;
            skip = 0;
            let attributeString;

            // Scan ahead and gather all strings for this attribute
            while (open) {
              attributeString = strings[i + skip + 1];
              const closingQuoteIndex = attributeString.indexOf(quoteCharacter);

              if (closingQuoteIndex === -1) {
                attributeStrings.push(Buffer.from(attributeString));
                skip++;
              } else {
                attributeStrings.push(Buffer.from(attributeString.slice(0, closingQuoteIndex)));
                nextString = attributeString.slice(closingQuoteIndex + 1);
                i += skip;
                open = false;
              }
            }

            part = processor.handleAttributeExpressions(name, attributeStrings, tagName);
          } else {
            part = processor.handleAttributeExpressions(name, [EMPTY_STRING_BUFFER$1, EMPTY_STRING_BUFFER$1], tagName);
          }
        }
      } else {
        part = processor.handleTextExpression(tagName);
      }

      this.strings.push(Buffer.from(string));
      // @ts-ignore: part will never be undefined here
      this.parts.push(part);
      // Add placehholders for strings/parts that wil be skipped due to multple values in a single AttributePart
      if (skip > 0) {
        this.strings.push(null);
        this.parts.push(null);
        skip = 0;
      }
    }

    this.strings.push(Buffer.from(nextString));
  }
}

/**
 * Determine if 'string' terminates with an opened or closed tag.
 *
 * Iterating through all characters has at worst a time complexity of O(n),
 * and is better than the alternative (using "indexOf/lastIndexOf") which is potentially O(2n).
 *
 * @param { string } string
 * @returns { Array<number> } - returns tuple "[-1, -1]" if no tag, "[0, i]" if closed tag, or "[1, i]" if open tag
 */
function getTagState(string) {
  for (let i = string.length - 1; i >= 0; i--) {
    const char = string[i];

    if (char === '>') {
      return [TAG_CLOSED, i];
    } else if (char === '<') {
      return [TAG_OPEN, i];
    }
  }

  return [TAG_NONE, -1];
}

/**
 * Retrieve tag name from "string" starting at "tagStateIndex" position
 * Walks forward or backward based on "tagState" open or closed
 *
 * @param { string } string
 * @param { number } tagState
 * @param { number } tagStateIndex
 * @returns { string }
 */
function getTagName(string, tagState, tagStateIndex) {
  let tagName = '';

  if (tagState === TAG_CLOSED) {
    // Walk backwards until open tag
    for (let i = tagStateIndex - 1; i >= 0; i--) {
      const char = string[i];

      if (char === '<') {
        return getTagName(string, TAG_OPEN, i);
      }
    }
  } else {
    for (let i = tagStateIndex + 1; i < string.length; i++) {
      const char = string[i];

      if (!RE_TAG_NAME.test(char)) {
        break;
      }

      tagName += char;
    }
  }

  return tagName;
}

const EMPTY_STRING_BUFFER$2 = Buffer.from('');

let id = 0;

/**
 * A class for consuming the combined static and dynamic parts of a lit-html Template.
 * TemplateResults
 */
class TemplateResult {
  /**
   * Constructor
   *
   * @param { Template } template
   * @param { Array<unknown> } values
   */
  constructor(template, values) {
    this.template = template;
    this.values = values;
    this.id = id++;
    this.index = 0;
  }

  /**
   * Consume template result content.
   *
   * @param { RenderOptions } [options]
   * @returns { unknown }
   */
  read(options) {
    let buffer = EMPTY_STRING_BUFFER$2;
    let chunk;
    /** @type { Array<Buffer> | undefined } */
    let chunks;

    while ((chunk = this.readChunk(options)) !== null) {
      if (isBuffer(chunk)) {
        buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length);
      } else {
        if (chunks === undefined) {
          chunks = [];
        }
        buffer = reduce(buffer, chunks, chunk) || EMPTY_STRING_BUFFER$2;
      }
    }

    if (chunks !== undefined) {
      chunks.push(buffer);
      return chunks.length > 1 ? chunks : chunks[0];
    }

    return buffer;
  }

  /**
   * Consume template result content one chunk at a time.
   * @param { RenderOptions } [options]
   * @returns { unknown }
   */
  readChunk(options) {
    const isString = this.index % 2 === 0;
    const index = (this.index / 2) | 0;

    // Finished
    if (!isString && index >= this.template.strings.length - 1) {
      // Reset
      this.index = 0;
      return null;
    }

    this.index++;

    if (isString) {
      return this.template.strings[index];
    }

    const part = this.template.parts[index];
    let value;

    if (isAttributePart(part)) {
      // AttributeParts can have multiple values, so slice based on length
      // (strings in-between values are already handled the instance)
      if (part.length > 1) {
        value = part.getValue(this.values.slice(index, index + part.length), options);
        this.index += part.length;
      } else {
        value = part.getValue([this.values[index]], options);
      }
    } else {
      value = part && part.getValue(this.values[index], options);
    }

    return value;
  }
}

/**
 * Commit "chunk" to string "buffer".
 * Returns new "buffer" value.
 *
 * @param { Buffer } buffer
 * @param { Array<unknown> } chunks
 * @param { unknown } chunk
 * @returns { Buffer | undefined }
 */
function reduce(buffer, chunks, chunk) {
  if (isBuffer(chunk)) {
    return Buffer.concat([buffer, chunk], buffer.length + chunk.length);
  } else if (isTemplateResult(chunk)) {
    chunks.push(buffer, chunk);
    return EMPTY_STRING_BUFFER$2;
  } else if (isArray(chunk)) {
    return chunk.reduce((buffer, chunk) => reduce(buffer, chunks, chunk), buffer);
  }
}

/**
 * Default templateResult factory
 *
 * @param { unknown } value
 * @returns { TemplateResult }
 */
// prettier-ignore
const DEFAULT_TEMPLATE_FN = (value) => html`${value}`;

const defaultTemplateProcessor = new DefaultTemplateProcessor();
const defaultTemplateResultProcessor = new DefaultTemplateResultProcessor();
const templateCache = new Map();

/**
 * Interprets a template literal as an HTML template that can be
 * rendered as a Readable stream or String
 *
 * @param { TemplateStringsArray } strings
 * @param  { ...unknown } values
 * @returns { TemplateResult }
 */
function html(strings, ...values) {
  let template = templateCache.get(strings);

  if (template === undefined) {
    template = new Template(strings, defaultTemplateProcessor);
    templateCache.set(strings, template);
  }

  return new TemplateResult(template, values);
}

/**
 * Render a template result to a string resolving Promise.
 *
 * @param { unknown } result - a template result returned from call to "html`...`"
 * @param { RenderOptions } [options]
 * @returns { Promise<string> }
 */
function renderToString(result, options) {
  return promiseTemplateRenderer(getRenderResult(result), defaultTemplateResultProcessor, false, options);
}

/**
 * Retrieve TemplateResult for render
 *
 * @param { unknown} result
 * @returns { TemplateResult }
 */
function getRenderResult(result) {
  // @ts-ignore
  return !isTemplateResult(result) ? DEFAULT_TEMPLATE_FN(result) : result;
}

export {
  AttributePart,
  BooleanAttributePart,
  DefaultTemplateProcessor,
  DefaultTemplateResultProcessor,
  EventAttributePart,
  NodePart,
  Part,
  PropertyAttributePart,
  Template,
  TemplateResult,
  defaultTemplateProcessor,
  defaultTemplateResultProcessor,
  directive,
  html,
  isAttributePart,
  isDirective,
  isNodePart,
  isTemplateResult,
  nothing,
  renderToBuffer,
  renderToStream,
  renderToString,
  html as svg,
  templateCache,
  unsafePrefixString,
};
