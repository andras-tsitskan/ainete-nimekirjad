import os
import json
import base64
import sys

from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=300_000,
    )
    return kdf.derive(password.encode("utf-8"))


def decrypt_envelope(envelope: dict, password: str) -> str:
    salt = base64.b64decode(envelope["salt"])
    iv   = base64.b64decode(envelope["iv"])
    data = base64.b64decode(envelope["data"])

    key = derive_key(password, salt)
    aesgcm = AESGCM(key)

    plaintext_bytes = aesgcm.decrypt(iv, data, None)
    return plaintext_bytes.decode("utf-8")


def main():
    password = os.environ.get("MALLID_PASSWORD", "").strip()
    if not password:
        print("ERROR: MALLID_PASSWORD environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    src = "lausepank-andmed.enc"
    dst = "lausepank-andmed.json"

    if not os.path.exists(src):
        print(f"ERROR: {src} not found.", file=sys.stderr)
        sys.exit(1)

    with open(src, "r", encoding="utf-8") as f:
        envelope = json.load(f)

    try:
        plaintext = decrypt_envelope(envelope, password)
    except Exception as e:
        print(f"ERROR: decryption failed: {e}", file=sys.stderr)
        sys.exit(1)

    with open(dst, "w", encoding="utf-8") as f:
        f.write(plaintext)

    print(f"OK: {src} decrypted → {dst}")


if __name__ == "__main__":
    main()
