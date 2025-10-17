"""
Verify JWT token expiration time.

This script decodes a JWT token and displays its expiration time.
"""

import sys
from datetime import datetime
from jose import jwt

if len(sys.argv) < 2:
    print("Usage: python verify_token_expiration.py <JWT_TOKEN>")
    sys.exit(1)

token = sys.argv[1]

# Decode without verification (just to inspect)
try:
    # Decode without verifying signature (we just want to see the expiration)
    payload = jwt.get_unverified_claims(token)

    exp_timestamp = payload.get("exp")
    if exp_timestamp:
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        now = datetime.now()
        time_until_expiry = exp_datetime - now

        print("Token Expiration Details:")
        print(f"  Expires at: {exp_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Current time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Time until expiry: {time_until_expiry}")
        print(f"  Hours until expiry: {time_until_expiry.total_seconds() / 3600:.2f}")
        print("\nToken Payload:")
        for key, value in payload.items():
            if key != "exp":
                print(f"  {key}: {value}")
    else:
        print("Error: Token does not contain 'exp' field")
        sys.exit(1)

except Exception as e:
    print(f"Error decoding token: {e}")
    sys.exit(1)
