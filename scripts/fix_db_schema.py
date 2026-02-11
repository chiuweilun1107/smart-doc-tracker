
import os
import psycopg2
from urllib.parse import urlparse

# DATABASE_URL from .env
# "postgresql://postgres.xazfwidknjcoafctkspj:Ally0323Ally@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.xazfwidknjcoafctkspj:Ally0323Ally@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres")

def fix_schema():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Connected to database...")
        
        # Check if column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='email';")
        exists = cur.fetchone()
        
        if not exists:
            print("Adding 'email' column to 'profiles' table...")
            cur.execute("ALTER TABLE profiles ADD COLUMN email VARCHAR;")
            conn.commit()
            print("Column added successfully!")
        else:
            print("'email' column already exists.")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_schema()
