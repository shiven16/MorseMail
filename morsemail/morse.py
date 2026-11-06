"""The language's exact 54-entry repertoire, including explicit extensions."""
LETTERS = '.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..'.split()
DIGITS = '----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.'.split()
MORSE = dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ', LETTERS))
MORSE.update(zip('0123456789', DIGITS))
MORSE.update({'.':'.-.-.-', ',':'--..--', '?':'..--..', "'":'.----.', '!':'-.-.--', '/':'-..-.', '(':'-.--.', ')':'-.--.-', '&':'.-...', ':':'---...', ';':'-.-.-.', '=':'-...-', '+':'.-.-.', '-':'-....-', '_':'..--.-', '"':'.-..-.', '$':'...-..-', '@':'.--.-.'})
REVERSE = {code:character for character,code in MORSE.items()}
