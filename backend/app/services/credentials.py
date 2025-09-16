"""
Credentials service for secure API key management
T-41: User API Key Management
"""

import os
from cryptography.fernet import Fernet


class CredentialsService:
    def __init__(self):
        # Get encryption key from environment or generate one
        self.encryption_key = os.getenv("CREDENTIALS_ENCRYPTION_KEY")
        if not self.encryption_key:
            # Generate a key for development (in production, this should be set in env)
            self.encryption_key = Fernet.generate_key()

        if isinstance(self.encryption_key, str):
            self.encryption_key = self.encryption_key.encode()

        self.cipher = Fernet(self.encryption_key)

    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt an API key for secure storage"""
        encrypted_key = self.cipher.encrypt(api_key.encode())
        return encrypted_key.decode()

    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt an API key for use"""
        decrypted_key = self.cipher.decrypt(encrypted_key.encode())
        return decrypted_key.decode()

    def get_key_preview(self, api_key: str) -> str:
        """Generate a safe preview of the API key"""
        if len(api_key) < 8:
            return "sk-...***"
        return f"{api_key[:7]}...{api_key[-4:]}"

    def validate_openai_key_format(self, api_key: str) -> bool:
        """Validate OpenAI API key format"""
        # OpenAI keys start with 'sk-' and are typically 51 characters
        if not api_key.startswith("sk-"):
            return False
        if len(api_key) < 20:  # Minimum reasonable length
            return False
        return True


# Global instance
credentials_service = CredentialsService()
