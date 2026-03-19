#!/usr/bin/env python3
"""
encrypt_lausepank.py — GitHub Actions encryption step.

Reads lausepank-andmed.json, encrypts it with AES-256-GCM + PBKDF2-SHA256
using the same parameters as the browser (lausepank-krypt.html / lausepank.html),
writes lausepank-andmed.enc, and deletes lausepank-andmed.json.

Algorithm matches the browser implementation exactly:
  - PBKDF2-HMAC-SHA256, 300 000 iterations, 16-byte random salt
  - AES-256-GCM, 12-byte random IV
  - Output: JSON { salt, iv, data } — all values base64-encoded
"""

import os
import json
import base64
import secrets
import sys

from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,           # 256-bit key
        salt=salt,
        iterations=300_000,
    )
    return kdf.derive(password.encode('utf-8'))


def encrypt(plaintext: str, password: str) -> str:
    salt = secrets.token_bytes(16)
    iv   = secrets.token_bytes(12)
    key  = derive_key(password, salt)

    aesgcm     = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)

    envelope = {
        'salt': base64.b64encode(salt).decode(),
        'iv':   base64.b64encode(iv).decode(),
        'data': base64.b64encode(ciphertext).decode(),
    }
    return json.dumps(envelope)


def main():
    password = os.environ.get('MALLID_PASSWORD', '').strip()
    if not password:
        print('ERROR: MALLID_PASSWORD environment variable is not set.', file=sys.stderr)
        sys.exit(1)

    src = 'lausepank-andmed.json'
    dst = 'lausepank-andmed.enc'

    if not os.path.exists(src):
        print(f'ERROR: {src} not found.', file=sys.stderr)
        sys.exit(1)

    with open(src, 'r', encoding='utf-8') as f:
        plaintext = f.read()

    # Validate JSON before encrypting
    try:
        json.loads(plaintext)
    except json.JSONDecodeError as e:
        print(f'ERROR: {src} is not valid JSON: {e}', file=sys.stderr)
        sys.exit(1)

    encrypted = encrypt(plaintext, password)

    with open(dst, 'w', encoding='utf-8') as f:
        f.write(encrypted)

    os.remove(src)
    print(f'OK: {src} encrypted → {dst} ({len(encrypted)} bytes), plaintext deleted.')


if __name__ == '__main__':
    main()
