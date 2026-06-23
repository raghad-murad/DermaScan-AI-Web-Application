from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    FIREBASE_SERVICE_ACCOUNT_PATH: str
    FRONTEND_URL: str = "http://localhost:5173"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@dermascan.ai"

    class Config:
        env_file = ".env"


settings = Settings()
