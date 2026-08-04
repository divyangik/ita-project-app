from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
INTERNAL_KEY = os.getenv("INTERNAL_KEY")