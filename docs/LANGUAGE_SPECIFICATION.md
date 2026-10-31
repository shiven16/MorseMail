# MorseScript Language Specification

**Project:** Morse Mail  
**Language:** MorseScript  

This document is the normative specification for the initial MorseScript compiler. “Must” denotes a required behavior. The language is deliberately small: one command per line, quoted strings, and two operations only.

## 1. Overview

MorseScript is a small source language for converting readable text to written International Morse notation (`SEND`) and converting written Morse notation back to readable text (`DECODE`). It gives Morse Mail a deterministic way to describe these conversions and, where a runtime device is available, to render encoded output as sound or light.

A user writes a `.ms` source file or enters source text, submits it to the compiler, and receives converted text or diagnostics. The compiler performs lexical analysis, syntax analysis, semantic validation, builds an intermediate representation (IR), then produces textual results and/or timed signal instructions.

Source syntax is not transmitted Morse. `SEND "SOS"` is a MorseScript instruction. Its encoded result is `... --- ...`; a transmitting backend converts that notation to on/off signals and timed gaps. In written notation spaces and `/` make boundaries explicit. In physical Morse, boundaries are durations of silence; `/` is never transmitted as a signal.

## 2. Source syntax

The only commands are:

| Command | Purpose |
|---|---|
| `SEND` | Encode a quoted normal-text string into written Morse notation and optional signal instructions. |
| `DECODE` | Decode a quoted written-Morse string into normal text. |

Keywords are uppercase and case-sensitive. `SEND` and `DECODE` are reserved only when they occur outside strings. `send` is not a keyword and is an unknown command.

Strings are delimited by ASCII double quotation marks (`"`). There is no escape syntax in version 0.1: a double quote cannot occur inside a string. Empty strings are lexically valid. `SEND ""` encodes to empty output; `DECODE ""` is rejected semantically because it contains no Morse character group. A program may contain zero or more commands. Each command occupies one logical line; commands cannot be separated by semicolons or placed on the same line.

For `SEND`, ASCII lowercase letters are converted to uppercase. No trimming or Unicode normalization occurs. Spaces within strings are significant: one or more ASCII spaces represent a word boundary in SEND input; repeated spaces collapse to one word boundary in Morse output. Leading or trailing spaces in SEND text are rejected as empty word boundaries (including an all-space string). Tabs and other whitespace inside either string are not supported.

## 3. Lexical specification

### 3.1 Tokens

| Token | Lexeme / pattern | Description |
|---|---|---|
| `SEND` | Exact uppercase `SEND` | Encoding keyword. |
| `DECODE` | Exact uppercase `DECODE` | Decoding keyword. |
| `STRING` | `"` followed by zero or more permitted non-quote characters, then `"` | String contents are retained without the delimiters. |
| `NEWLINE` | LF (`\n`), CRLF (`\r\n`), or CR (`\r`) | Logical statement separator. CRLF is one newline token. |
| `EOF` | End of source | Exactly one token emitted after source exhaustion. |

The lexer recognizes keywords only as complete words. A keyword must be followed by a permitted outside-string separator (horizontal whitespace, newline, or EOF); e.g. `SENDX` is one unknown keyword/identifier lexeme, not `SEND` followed by `X`.

### 3.2 Whitespace and string rules

Outside strings, ASCII space and horizontal tab are insignificant and may appear before, between, or after a command and its string. They do not separate instructions. Newlines do separate instructions and are emitted as `NEWLINE`. Other control characters outside strings are invalid characters.

Inside strings, the permitted source characters are printable ASCII U+0020 through U+007E except `"` (U+0022). Thus spaces and punctuation are preserved exactly; tabs, newlines, control characters, non-ASCII characters, and an embedded quote are not permitted. Since there is no escape mechanism, a quote always closes a string. An actual newline before the closing quote produces an unterminated-string error at the opening quote. A quote followed by further text starts normal tokenization after the string.

The lexer does not interpret or validate Morse character groups inside a string. It only recognizes a `STRING`; Morse alphabet and separator validation belongs to semantic analysis.

### 3.3 Locations and lexical failures

Line and column numbers are 1-based. Columns count Unicode scalar values; tabs outside strings advance to the next 8-column tab stop. The location of a token is the location of its first source character. For an unterminated string, report the opening quote location. For an invalid character, report that character's location. Newline resets the column to 1. EOF has the location immediately after the last source character.

The lexer reports and stops at the first lexical error. Lexical errors include unknown command lexemes, invalid characters, forbidden characters inside strings, and unterminated strings. No `INVALID` token is emitted.

## 4. Grammar

The grammar below uses lexical tokens. `HWS` means one or more ASCII spaces or tabs. HWS is not emitted as a token; the lexer records the amount of horizontal whitespace immediately before each token as trivia, and the parser uses that trivia to enforce the required gap after a keyword. Newline tokens are retained. A `STRING` token includes its quotes lexically but exposes only its contents as the token value.

```ebnf
program          = { NEWLINE }, [ statement, { NEWLINE, { NEWLINE }, statement }, { NEWLINE } ], EOF ;
statement        = send_statement | decode_statement ;
send_statement   = SEND, HWS, STRING ;
decode_statement = DECODE, HWS, STRING ;
```

There must be at least one horizontal whitespace character between the command and its string. Leading, trailing, and repeated blank lines are allowed. An empty or all-blank program is valid. A final newline is optional. Whitespace around the string after its closing quote is allowed only until that line's newline or EOF. A second command on the same physical line is invalid.

The parser accepts only the grammar above. It does not check text characters against the Morse dictionary or inspect Morse contents. Missing arguments, extra tokens, or missing newline separators are syntax errors.

### Valid syntax

```text
SEND "SOS"
DECODE "... --- ..."

SEND "HELLO WORLD"
DECODE ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."
```

The blank line and final newline in the example are optional.

### Invalid syntax

```text
send "SOS"          # unknown, case-sensitive keyword
SEND                 # missing STRING
SEND"SOS"            # missing required horizontal whitespace
SEND "SOS" DECODE "..."  # two statements on one line
```

## 5. Morse Code and supported repertoire

MorseScript uses International Morse Code. The alphabet, figures, and core punctuation below match ITU-R Recommendation M.1677-1, Annex 1, Part I, clauses 1.1.1–1.1.3. The table includes the exact character/code associations used by the compiler.

### 5.1 Letters

| Character | Morse | Character | Morse | Character | Morse |
|---|---|---|---|---|---|
| A | `.-` | J | `.---` | S | `...` |
| B | `-...` | K | `-.-` | T | `-` |
| C | `-.-.` | L | `.-..` | U | `..-` |
| D | `-..` | M | `--` | V | `...-` |
| E | `.` | N | `-.` | W | `.--` |
| F | `..-.` | O | `---` | X | `-..-` |
| G | `--.` | P | `.--.` | Y | `-.--` |
| H | `....` | Q | `--.-` | Z | `--..` |
| I | `..` | R | `.-.` |  |  |

### 5.2 Numbers

| Character | Morse | Character | Morse |
|---|---|---|---|
| 0 | `-----` | 5 | `.....` |
| 1 | `.----` | 6 | `-....` |
| 2 | `..---` | 7 | `--...` |
| 3 | `...--` | 8 | `---..` |
| 4 | `....-` | 9 | `----.` |

### 5.3 Punctuation

ITU-R M.1677-1 explicitly lists the punctuation/signs period, comma, colon, question mark, apostrophe, hyphen, fraction bar, parentheses, quotation marks, double hyphen/equal sign, plus, and commercial at. For implementation compatibility, this initial language also supports the additional entries explicitly requested below; those entries are not all enumerated in M.1677-1. They are language repertoire extensions and must not be represented as ITU table entries. The mappings are fixed as written here.

| Character | Morse | Status |
|---|---|---|
| `.` | `.-.-.-` | ITU-R M.1677-1 |
| `,` | `--..--` | ITU-R M.1677-1 |
| `?` | `..--..` | ITU-R M.1677-1 |
| `'` | `.----.` | ITU-R M.1677-1 (apostrophe) |
| `!` | `-.-.--` | Language repertoire extension |
| `/` | `-..-.` | ITU-R M.1677-1 (fraction bar) |
| `(` | `-.--.` | ITU-R M.1677-1 |
| `)` | `-.--.-` | ITU-R M.1677-1 |
| `&` | `.-...` | Language repertoire extension |
| `:` | `---...` | ITU-R M.1677-1 |
| `;` | `-.-.-.` | Language repertoire extension |
| `=` | `-...-` | ITU-R M.1677-1 (double hyphen) |
| `+` | `.-.-.` | ITU-R M.1677-1 |
| `-` | `-....-` | ITU-R M.1677-1 |
| `_` | `..--.-` | Language repertoire extension |
| `"` | `.-..-.` | ITU-R M.1677-1 (quotation mark) |
| `$` | `...-..-` | Language repertoire extension |
| `@` | `.--.-.` | ITU-R M.1677-1 |

In MorseScript `SEND`, `"` cannot appear in input because it is the string delimiter and there is no escape syntax. Its mapping is nevertheless part of the decode dictionary: `DECODE ".-..-."` returns a quote character. The supported SEND repertoire is A–Z after case normalization, 0–9, the punctuation above except the source quote, and ASCII space as a word boundary. All other characters, including accented letters, are rejected. The standard's accented `é` signal is intentionally outside the initial language repertoire.

The International standard source of truth is [ITU-R M.1677-1 (10/2009), official recommendation page](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/) and its [official English PDF](https://www.itu.int/dms_pubrec/itu-r/rec/m/r-rec-m.1677-1-200910-i%21%21pdf-e.pdf). The timing rules below correspond to clause 2. Extra repertoire entries are explicitly identified as language extensions, not standard mappings.

## 6. Written notation and separation

Within one Morse character there is no written separator between dots and dashes. A single ASCII space separates adjacent Morse character groups. A slash surrounded by one or more ASCII spaces denotes a word boundary. Example: `.... . .-.. / .-.. ---` means `HEL LO` (with the word break where the slash occurs).

The slash delimiter is notation only. The actual slash character is an encodable character whose Morse sequence is `-..-.`; it appears as an ordinary dot-dash group, never as the word-boundary slash delimiter.

For DECODE input, the canonical notation is one ASCII space between adjacent character groups and exactly ` / ` between words. To simplify human input, runs of two or more spaces between nonempty groups are treated as a single character separator. A lone slash with optional spaces immediately around it is accepted as the word separator. Leading/trailing whitespace around the entire Morse string is ignored. Leading/trailing slash, adjacent slashes, slash with no group on either side, tabs, and empty groups are errors. A slash without surrounding spaces is still a separator (`.../---` is accepted). Thus slash can never be confused with the encoded slash character `-..-.`.

Permitted Morse body characters are `.`, `-`, ASCII space, and `/`. A valid group is a nonempty sequence of dots and dashes exactly matching one entry in the reverse dictionary. Every separated nonempty group is a character; unsupported combinations are semantic errors. For example `.-.-.-` is one period; `.- -.-.-` is A followed by a period.

## 7. Semantic specification

### 7.1 SEND

For each STRING value, scan characters in order. Convert ASCII `a`–`z` to `A`–`Z`; map each supported letter, digit, or punctuation character to exactly one Morse group. A run of one or more ASCII spaces marks one word boundary. Leading/trailing spaces and empty words are rejected. Unsupported characters produce semantic errors at the character's source location. No unsupported input is silently dropped or substituted.

The encoder produces one group per non-space source character, spaces groups with one ASCII space, and uses ` / ` between words. Punctuation does not imply a word boundary.

### 7.2 DECODE

Strip leading/trailing ASCII spaces, tokenize by runs of ASCII spaces and slash delimiters, and validate separators. Each dot-dash group must map to exactly one supported character. Slash divides words; adjacent character groups within each word are joined without spaces. Unsupported combinations, invalid symbols, empty groups, and malformed word separators are semantic errors. Decoded letters are uppercase; the dictionary's punctuation is returned as its corresponding character.

### 7.3 Phase boundaries and error classes

- **Lexical error:** source cannot be tokenized, e.g. unterminated quote or `$` outside a string.
- **Syntax error:** tokens do not form the grammar, e.g. `SEND` without a string or two instructions on one line.
- **Semantic error:** a syntactically valid string violates the operation's content rules, e.g. `SEND "café"` or `DECODE "..--"`.

## 8. Compiler architecture

1. **Source Code:** Input text and physical line endings.
2. **Lexical Analysis:** Produce keyword, string, newline, and EOF tokens with source spans; reject invalid source characters and unterminated strings. Keyword recognition occurs only outside strings.
3. **Syntax Analysis:** Apply the grammar, build one statement node per command, enforce required whitespace and line boundaries, and reject missing or extra tokens.
4. **Semantic Analysis:** Validate SEND characters and word boundaries or DECODE symbols, Morse groups, and word-separator placement. Normalize SEND lowercase letters.
5. **Intermediate Representation:** Store validated operation, normalized input, and groups/word boundaries.
6. **Code Generation:** Render notation text and/or convert groups to signal instructions with timing metadata. Backend-specific audio or light rendering consumes those instructions.
7. **Execution / Output:** Present encoded or decoded text; optionally play beeps or blink a light when such a device/runtime is configured. The language definition does not require a particular hardware device.

## 9. Intermediate representation

The IR is a sequence of operation records. `words` is an ordered list of words, each word is an ordered list of character groups. This shape preserves word boundaries without conflating them with the Morse encoding of `/`.

SEND example:

```text
SEND "SOS"

{
  operation: ENCODE,
  input: "SOS",
  words: [["...", "---", "..."]],
  notation: "... --- ..."
}
```

DECODE example:

```text
DECODE ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."

{
  operation: DECODE,
  input: ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
  words: [
    ["....", ".", ".-..", ".-..", "---"],
    [".--", "---", ".-.", ".-..", "-.."]
  ],
  text: "HELLO WORLD"
}
```

A signal backend may lower either operation to a common sequence of `MARK(duration)` and `GAP(duration)` instructions. Word boundaries remain distinct in IR until lowering.

## 10. Code generation and output

For SEND, the primary output is written notation. The optional signal output expands each group into a mark sequence and inserts timing gaps. For DECODE, the primary output is readable uppercase text, with one ASCII space between decoded words.

Timing uses one dot duration as the configurable base unit `u`:

| Signal/event | Duration |
|---|---:|
| Dot mark | 1u |
| Dash mark | 3u |
| Gap inside a character | 1u |
| Gap between characters | 3u |
| Gap between words | 7u |

Each mark is followed by an intra-character gap only when another mark follows in that same character. Between groups, use a 3u gap; instead use a 7u gap across a word boundary. Do not add both gaps for one boundary. Audio maps marks to tone-on intervals and gaps to silence; light maps marks to illuminated intervals and gaps to off intervals. Frequency, absolute unit duration, amplitude, and device control are runtime configuration and are not fixed by this language version.

## 11. Error specification

Locations refer to 1-based line and column. For content errors, the compiler reports the source position of the offending character/group where practical; an error spanning a separator points to that separator. Exact punctuation of messages may vary, but category, location, and diagnostic meaning must match these forms.

| Error | Example input | Category | Expected diagnostic | Phase |
|---|---|---|---|---|
| Unknown keyword | `send "SOS"` | Lexical | `1:1: unknown command 'send' (keywords are case-sensitive)` | Lexer |
| Missing string | `SEND` | Syntax | `1:5: expected STRING after SEND` | Parser |
| Unterminated string | `SEND "SOS` | Lexical | `1:6: unterminated string` | Lexer |
| Unsupported source character | `SEND "CAFÉ"` | Semantic | `1:10: unsupported SEND character 'É'` | Semantic analyzer |
| Invalid Morse symbol | `DECODE ".-x"` | Semantic | `1:11: invalid Morse symbol 'x'` | Semantic analyzer |
| Invalid Morse group | `DECODE "..--"` | Semantic | `1:9: invalid Morse group '..--'` | Semantic analyzer |
| Missing statement separator | `SEND "A" DECODE ".-"` | Syntax | `1:11: expected newline or end of input after statement` | Parser |
| Unexpected token | `SEND "A" "B"` | Syntax | `1:10: unexpected STRING after statement` | Parser |
| Empty Morse group | `DECODE "...  ---"` | — | No error: repeated spaces collapse to one separator. A truly empty group cannot be represented by spaces under the separator rule. | — |
| Incorrect word separator placement | `DECODE "/ ..."` | Semantic | `1:8: word separator must have a character group on both sides` | Semantic analyzer |
| Invalid outside-string character | `SEND "A" #` | Lexical | `1:10: invalid character '#'` | Lexer |
| Forbidden string character | A literal tab inside `SEND "A<TAB>B"` | Lexical | `1:8: tab is not permitted inside a string` | Lexer |

`Empty Morse group` is defined as a semantic rejection whenever input parsing yields an empty group between separators. Because repeated spaces are explicitly normalized, two or more spaces alone do not create an empty group; leading/trailing slash and adjacent slash are the common empty-word/group forms and receive the word-separator diagnostic. Implementations must not emit the example message as an error for `"...  ---"`.

## 12. Conformance test cases

Expected text below is exact output; notation uses ASCII dot, hyphen, space, and slash. Each invalid case expects one diagnostic at the first error.

### 12.1 Valid SEND programs

| Source | Expected output |
|---|---|
| `SEND "SOS"` | `... --- ...` |
| `SEND "Hello World"` | `.... . .-.. .-.. --- / .-- --- .-. .-.. -..` |
| `SEND "A  B"` | `.- / -...` |
| `SEND "A1?"` | `.- .---- ..--..` |
| `SEND "A/B"` | `.- -..-. -...` |
| `SEND ""` | empty output |

### 12.2 Valid DECODE programs

| Source | Expected output |
|---|---|
| `DECODE "... --- ..."` | `SOS` |
| `DECODE ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."` | `HELLO WORLD` |
| `DECODE ".-  -..."` | `AB` |
| `DECODE "-..-."` | `/` |
| `DECODE ""` | Semantic error: `1:8: DECODE input must contain at least one Morse group` |

### 12.3 Valid multi-instruction programs

| Source | Expected outputs, in source order |
|---|---|
| `SEND "A"` newline `DECODE "-..."` | `.-`; then `B` |
| blank line, `SEND "SOS"`, blank line, `DECODE "..."`, final newline | `... --- ...`; then `E` |
| empty source | no outputs |

### 12.4 Lexical errors

| Source | Expected error |
|---|---|
| `send "SOS"` | `1:1: unknown command 'send' (keywords are case-sensitive)` |
| `SEND "SOS` | `1:6: unterminated string` |
| `SEND "A" #` | `1:10: invalid character '#'` |
| literal tab inside `SEND "A<TAB>B"` | `1:8: tab is not permitted inside a string` |
| `SEND "é"` | Lexically valid; semantic error `1:7: unsupported SEND character 'é'` |

### 12.5 Syntax errors

| Source | Expected error |
|---|---|
| `SEND` | `1:5: expected STRING after SEND` |
| `SEND"A"` | `1:5: expected horizontal whitespace after SEND` |
| `SEND "A" DECODE "-..."` | `1:10: expected newline or end of input after statement` |
| `SEND "A" "B"` | `1:10: unexpected STRING after statement` |
| `DECODE 123` | `1:8: expected STRING after DECODE` |

### 12.6 Semantic errors

| Source | Expected error |
|---|---|
| `SEND "CAFÉ"` | `1:10: unsupported SEND character 'É'` |
| `SEND " A"` | `1:7: SEND text cannot begin or end with a word boundary` |
| `DECODE ".-x"` | `1:11: invalid Morse symbol 'x'` |
| `DECODE "..--"` | `1:9: invalid Morse group '..--'` |
| `DECODE "/ ..."` | `1:8: word separator must have a character group on both sides` |
| `DECODE "... / / ---"` | `1:13: word separator must have a character group on both sides` |
| `DECODE "...\t---"` | Lexer error: tab is not permitted inside a string |
| `DECODE ""` | `1:8: DECODE input must contain at least one Morse group` |

### 12.7 Morse encoding edge cases

| Source | Expected output |
|---|---|
| `SEND "abcdefghijklmnopqrstuvwxyz"` | `.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..` |
| `SEND "0123456789"` | `----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.` |
| `SEND " ."` | Error: leading word boundary (same rule as semantic table) |
| `SEND "A   B"` | `.- / -...` |
| `SEND "!&;=_$@"` | `-.-.-- .-... -.-.-. ..--.- ...-..- .--.-.` |

### 12.8 Morse decoding edge cases

| Source | Expected output |
|---|---|
| `DECODE "----- .----"` | `01` |
| `DECODE ".../---"` | `S O` |
| `DECODE "... ---"` | `SO` |
| `DECODE "... / ---"` | `S O` |
| `DECODE "... /"` | Error: word separator must have a character group on both sides |
| `DECODE "...//---"` | Error: word separator must have a character group on both sides |

## 13. Implementation constraints and conformance summary

Version 0.1 contains only `SEND` and `DECODE`; double-quoted strings; newline-separated instructions; no variables, comments, escapes, expressions, or user-defined functions. Normal text is uppercased for encoding. Morse letters are separated by spaces and words by slash notation. The supported repertoire and mappings are exactly the tables in this specification; unsupported characters/groups are errors.

A conforming initial compiler must implement the lexer, grammar, semantic rules, IR boundaries, and timing durations defined here. Device output may be unavailable, but when provided it must follow the stated unit timing. No unstated coercions, transliteration, punctuation substitutions, or recovery from invalid content are permitted.
