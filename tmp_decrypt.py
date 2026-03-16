ALPHABET=[ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
			'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

def getIndexOfChar(searchedChar):
    for i in range(len(ALPHABET)):
            if ( ALPHABET[i]==searchedChar):
                return i
    raise ValueError("You can not search this char '" + searchedChar + "'");

def decipher(cypheredText,shiftKey):
    plainText=""
    for i in range(len(cypheredText)):
        charPosition = getIndexOfChar(cypheredText[i])
        key = charPosition - shiftKey
        if key < 0:
            key += 26
        replaceVal = ALPHABET[key]
        plainText += replaceVal
    return plainText

plainText = "ftqpdazquenqzqmftftqqurrqxfaiqd" 
for i in range(len(ALPHABET)):
    print(f"Shift {i}: {decipher(plainText, i)}")
