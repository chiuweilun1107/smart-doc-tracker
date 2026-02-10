import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load .env explicitly
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(project_root, '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found.")
    sys.exit(1)

def execute_sql_file(filename):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        with open(filename, 'r') as f:
            sql_commands = f.read()
            
        print(f"Executing SQL from {filename}...")
        # Split by simple semicolon isn't perfect for functions but works for this simple file 
        # actually psycopg2 handles whole script execution well typically
        cur.execute(sql_commands)
        
        print("Success! Security policies applied.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error executing SQL: {e}")
        sys.exit(1)

if __name__ == "__main__":
    sql_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "security_setup.sql")
    execute_sql_file(sql_file)
